<script setup lang="ts">
import {onMounted, watch} from 'vue';
import { useConfigStore } from '../store/configStore';
import { generateKey } from '../utils';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {AllowListToSource} from "@/types";

const configStore = useConfigStore();


onMounted(() => {
    if (Object.keys(configStore.allowList).length == 0) {
      addNewAllowList();
    }
});

function addNewAllowList() {
  const key = generateKey()
  configStore.allowList[key] = {allowed: ""}
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
      handleTypingDone(newValue);
  }, 1000);
}, { deep: true });

interface TwitchUser {
  name: string;
  id: string;
}

function handleTypingDone(allowListKeyMap: AllowListToSource): void {
  const twitchNameToIdMap: { [key: string]: TwitchUser[] } = {};
  for(let allowListKey in allowListKeyMap) {
    configStore.allowList[allowListKey].allowed.split(",").forEach((name) => {
      // console.log(`https://decapi.me/twitch/id/${name.trim()}`);
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
                        {{ ind + 1 }}
                    </td>

                    <!-- Position -->
                    <td>
                        <input v-model.number="listData.allowed">
                    </td>
                    <td class="">
                        <button type="button" @click="removeGroup(key as string)" class="focus:outline-none text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:ring-red-300
                            font-medium rounded-lg text-md px-2.5 py-2 transition active:scale-[.95]"
                                :class="{ 'invisible': Object.keys(configStore.allowList).length == 1 }">
                            <FontAwesomeIcon icon="times"></FontAwesomeIcon>
                        </button>
                    </td>
                </tr>
                <tr key="add-btn">
                    <td colspan="6">
                        <button type="button" @click="addNewAllowList"
                            class="m-2 px-8 py-1 font-semibold text-white bg-green-500 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition active:scale-[.95]">
                            <FontAwesomeIcon class="mr-2" icon="plus"></FontAwesomeIcon>
                            Add new allow list
                        </button>
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

input {
    width: 100%;
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