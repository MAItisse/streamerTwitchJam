<script setup lang="ts">
import {onMounted, watch} from 'vue';
import { useConfigStore } from '../store/configStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {AllowListToSource} from "@/types";

const configStore = useConfigStore();
let newAllowListItem = '';

onMounted(() => {
  if (Object.keys(configStore.allowList).length == 0) {
    addNewAllowList("vips");
    addNewAllowList("mods");
  }
  configStore.addStreamerToAllLists = false;
});

function addNewAllowList(key: string = "") {
  // TODO change this logic to get the first next available key, or use a proper name
  if(key == "") key = Object.keys(configStore.allowList).length - 1 + ""
  configStore.allowList[key] = {allowed: ""}
  newAllowListItem = "";
  // console.log("allowList = ", configStore.allowList);
}

function removeGroup(key: string) {
  delete configStore.allowList[key];
  // console.log("allowList = ", configStore.allowList);
  // console.log(key);
}
let timeoutId: NodeJS.Timeout | null = null;
watch(() => configStore.allowList, (newValue, _) => {
  // console.log("AllowList: watch props.allowList fired.");
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  // Set a new timeout to trigger the function after 1 second
  timeoutId = setTimeout(() => {
    handleTypingDone(newValue, configStore.addStreamerToAllLists);
  }, 1000);
}, { deep: true });

watch(() => configStore.addStreamerToAllLists, () => {
  // console.log("AllowList: watch props.allowList fired.");
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  // Set a new timeout to trigger the function after 1 second
  timeoutId = setTimeout(() => {
    handleTypingDone(configStore.allowList, configStore.addStreamerToAllLists);
  }, 250);
}, { deep: true });

interface TwitchUser {
  name: string;
  id: string;
}

function handleTypingDone(allowListKeyMap: AllowListToSource, addStreamer: boolean): void {
  const twitchNameToIdMap: { [key: string]: TwitchUser[] } = {};
  for(let allowListKey in allowListKeyMap) {
    let allowedNames = configStore.allowList[allowListKey].allowed.split(",");
    if(addStreamer) {
      allowedNames.push(configStore.twitchUsername);
    }
    allowedNames.forEach((name) => {
      console.log(`https://decapi.me/twitch/id/${name.trim()}`);
      fetch(`https://decapi.me/twitch/id/${name.trim()}`).then((response) => {
        if(!response.ok) {
          throw new Error(`http error ${response.status}`);
        }
        return response.text();
      }).then((id) => {
        // console.log(id);
        // console.log(allowListKey);
        if (!twitchNameToIdMap[allowListKey]) {
          twitchNameToIdMap[allowListKey] = []; // Initialize the array if it doesn't exist
        }
        twitchNameToIdMap[allowListKey].push({'name':name.trim(), 'id':id});
      }).catch((error) => {
        console.error("error getting twitch id ", error)
      })
    });
  }
  configStore.twitchNameToUserId = twitchNameToIdMap;
  console.log(twitchNameToIdMap);
}

function onStreamerAdded(event: any) {
  console.log(event.target.checked);
  configStore.addStreamerToAllLists = event.target.checked;
}

</script>

<template>
    <div class="w-full">
        <div class="mb-2">
            <h1 class="mb-0 text-md font-extrabold">
                <FontAwesomeIcon class="mr-1 text-xl" icon="object-ungroup"></FontAwesomeIcon>
                Allow List
            </h1>
            <span class="font-semibold text-gray-500 text-sm">
              Only users on the selected list can move a source that it is applied to
            </span>
          <div class="flex items-center">
            <label for="addStreamer" class="mr-2">add streamer to all lists</label>
              <input name="addStreamer" id="addStreamer" type="checkbox" @change="onStreamerAdded($event)"
                     class="form-checkbox checkbox-lg scale-150 ml-4 h-5 w-5 text-blue-600 transition active:scale-[.95]" />
          </div>
        </div>
        <table class="w-full bg-white">
            <thead>
                <tr class="bg-gray-300">
                    <th>#</th>
                    <th>Allowed Accounts, comma separated</th>
                    <th></th>
                </tr>
            </thead>
            <transition-group name="fade" tag="tbody">
                <tr v-for="(listData, key, ind) in configStore.allowList" :key="key" class="hover:bg-gray-50 fade-row">
                    <td>
                      {{ key }}
<!--                      <input v-model.lazy="listData.">-->
                    </td>

                    <!-- Position -->
                    <td>
                        <input v-model.number="listData.allowed">
                    </td>
                    <td class="">
                        <button type="button" @click="removeGroup(key as string)" class="focus:outline-none text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:ring-red-300
                            font-medium rounded-lg text-md px-2.5 py-2 transition active:scale-[.95]"
                                :class="{ 'invisible': Object.keys(configStore.allowList).length == 0 }">
                            <FontAwesomeIcon icon="times"></FontAwesomeIcon>
                        </button>
                    </td>
                </tr>
                <tr key="add-btn">
                    <td colspan="14">
                      <tr class="content-center">
                        <td class="w-2/5 text-center align-middle">
                          <input type="text" placeholder="new group name" v-model="newAllowListItem"
                                 class="mr-auto px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </td>
                        <td class="w-3/5 text-center align-middle">
                        <button type="button" @click="addNewAllowList(newAllowListItem)"
                            class="px-10 py-1 font-semibold text-white bg-green-500 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition active:scale-[.95]">
                            <FontAwesomeIcon class="mr-2" icon="plus"></FontAwesomeIcon>
                            Add new allow list
                        </button>
                        </td>
                      </tr>
                    </td>
                </tr>
            </transition-group>
        </table>
        <div class="flex flex-row-reverse">
        </div>
    </div>
</template>

<!-- <td class="px-6 py-4 border-b border-gray-200"> -->
<style scoped lang="scss">
th,
td {
    border-bottom-width: 2px;
    border-left-width: 1px;
    border-right-width: 0px;
    border-top-width: 0px;
    border-collapse: collapse;
    border-color: rgb(209, 213, 219);
    border-style: solid;

    height: 36px;
    padding-right: 7px;
    vertical-align: middle;

    box-sizing: border-box;
    color: rgb(55, 65, 81);
    font-size: 14px;
    font-weight: 600;
    line-height: 12px;
    text-align: center;
    text-indent: 4px;
}
td > input {
  width: 100%;
}

input {
    padding: 0px;
    padding-left: 0px;
    appearance: auto;
    background-color: rgb(255, 255, 255);
    border-collapse: collapse;
    border-color: rgb(209, 213, 219);
    border-style: solid;
    border-width: 2px;
    border-radius: 8px;
    box-sizing: border-box;
}
</style>