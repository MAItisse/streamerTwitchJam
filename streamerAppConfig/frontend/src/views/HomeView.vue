<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { LoadSecretPy, SaveSecretPy, GetBounds, GetInfoWindowConfig, GetSceneItems, ConnectOBS } from '../../wailsjs/go/main/App';
import StatusMessage from '@/components/StatusMessage.vue';
import PreviewWindow from '@/components/PreviewWindow.vue';

type StatusMessage = {
  Status: string,
  Message: string,
  Data: any,
};

type Bound = {
  left: number,
  top: number,
  right: number,
  bottom: number
}

const secretPy = ref({
  "Username": "",
  "Password": "",
})

const saveStatusMessage = ref();
// const connectObsStatusMessage = ref();
const connectObsStatusMessage = ref();
const bounds = ref();
const uniqueBounds = ref();
const infoWindowConfig = ref();
const sceneItems = ref();

const enabledSources = ref({
  "4": 1
});

function makeid(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// const uniqueBounds = computed(() => {

//   if (!bounds.value) {
//     return [];
//   }

//   const boundsArray = Object.keys(bounds.value.Data.bounds).map(function (key) { return bounds.value.Data.bounds[key] })

//   // Use a Set to keep track of unique serialized objects
//   const uniqueSet = new Set();
//   const uniqueBounds = [];

//   for (const bound of boundsArray) {
//     const serializedBound = JSON.stringify(bound);

//     if (!uniqueSet.has(serializedBound)) {
//       uniqueSet.add(serializedBound);
//       uniqueBounds.push(bound);
//     }
//   }

//   return uniqueBounds;
// })

onMounted(() => {
  LoadSecretPy().then((data) => secretPy.value = data)
})

function submitSecret() {
  SaveSecretPy(secretPy.value).then((res) => {
    saveStatusMessage.value = res;
  })
}

function connectObs() {
  SaveSecretPy(secretPy.value).then((res) => {
    // Connect to OBS
    ConnectOBS().then((res) => {
      connectObsStatusMessage.value = res

      if (res.Status == "error") {
        return;
      }

      // Get bounds
      GetBounds().then((res) => {
        console.log("GetBounds response:", res)
        // connectObsStatusMessage.value = res

        bounds.value = res

        const boundsArray = Object.keys(bounds.value.Data.bounds).map(function (key) { return bounds.value.Data.bounds[key] })

        const uniqueSet = new Set();
        const newUniqueBounds = [];

        for (const bound of boundsArray) {
          const serializedBound = JSON.stringify(bound);

          if (!uniqueSet.has(serializedBound)) {
            uniqueSet.add(serializedBound);
            newUniqueBounds.push(bound);
          }
        }

        // Add a unique key to each boundary
        for (let bound of newUniqueBounds) {
          bound.key = makeid(8);
        }

        uniqueBounds.value = newUniqueBounds
      });

      // Get existing infoWindowConfig
      GetInfoWindowConfig().then((res) => {
        console.log("GetInfoWindowConfig response:", res);
        infoWindowConfig.value = res
      })

      // Get "Scene" sceneItems
      GetSceneItems().then((res) => {
        console.log("GetSceneItems response:", res);
        for (let item of res.Data.sceneItems) {
          if (item.sceneItemId in infoWindowConfig.value.Data) {
            item.twitch_movable = true;
          } else {
            item.twitch_movable = false;
          }
        }

        sceneItems.value = res
      })

    });
  });
}

const updateUniqueBounds = (newBounds: object) => {
  console.log("Updating boundaries... ", newBounds)
  uniqueBounds.value = newBounds;
};

</script>

<template>
  <div class="home">
    <div class="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg max-w-md mx-auto">
      <form class="w-full space-y-4">
        <!-- Twitch Username Row -->
        <div class="flex flex-col">
          <label for="twitchUsername" class="mb-1 text-sm font-medium text-gray-700">Twitch Username</label>
          <input id="twitchUsername" v-model="secretPy.Username" type="text" placeholder="Enter your Twitch username"
            class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- OBS Password Row -->
        <div class="flex flex-col">
          <label for="obsPassword" class="mb-1 text-sm font-medium text-gray-700">OBS WebSocket Server Password</label>
          <input id="obsPassword" v-model="secretPy.Password" type="password"
            placeholder="Enter your OBS WebSocket Password"
            class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Submit Button -->
        <button type="submit" @click="submitSecret"
          class="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Save
        </button>
        <StatusMessage v-if="saveStatusMessage" :status-message="saveStatusMessage"></StatusMessage>
      </form>
      <button type="button" @click="connectObs"
        class="w-full m-4 px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Connect to OBS
      </button>
      <StatusMessage v-if="connectObsStatusMessage" :status-message="connectObsStatusMessage"></StatusMessage>
    </div>

    <!-- Setup boundaries -->
    uniqueBounds: {{ uniqueBounds }}
    <div v-if="connectObsStatusMessage && connectObsStatusMessage.Status == 'success'" class="p-4">
      <div class="flex flex-col mt-4 items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg mx-auto">
        <div class="w-full">
          <div v-if="bounds">
            <div class="overflow-x-auto">
              <h1 class="mb-4 text-xl font-extrabold dark:text-white">Setup Screen Boundaries <small
                  class="m-4 font-semibold text-gray-500 dark:text-gray-400">Users can't drag Sources outside of their
                  assigned boundaries</small></h1>
              <div>

                <table class="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        ID</th>
                      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Top</th>
                      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Left</th>
                      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Right</th>
                      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Bottom</th>
                      <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(bound, ind) in uniqueBounds" :key="bound.key" class="hover:bg-gray-50">

                      <!-- Positoin Checkbox -->
                      <td class="px-6 py-4 border-b border-gray-200">
                        {{ ind+1 }}
                      </td>

                      <!-- Position -->
                      <td class="px-6 py-4 border-b border-gray-200">
                        <input type="text" v-model="bound.top"
                          class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </td>
                      <td class="px-6 py-4 border-b border-gray-200">
                        <input type="text" v-model="bound.left"
                          class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </td>
                      <td class="px-6 py-4 border-b border-gray-200">
                        <input type="text" v-model="bound.right"
                          class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </td>
                      <td class="px-6 py-4 border-b border-gray-200">
                        <input type="text" v-model="bound.bottom"
                          class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </td>

                      <td class="px-6 py-4 border-b border-gray-200">
                        <button type="button"
                          class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-md px-2.5 py-1 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">X</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="flex justify-center">
                <PreviewWindow :videoWidth="1920" :videoHeight="1080" :boundaries="uniqueBounds"
                  @update:uniqueBounds="updateUniqueBounds" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Choose Sources -->
    <div v-if="connectObsStatusMessage && connectObsStatusMessage.Status == 'success'" class="p-4">
      <div class="flex flex-col mt-4 items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg mx-auto">
        <div class="w-full">
          <div v-if="sceneItems">
            <div class="overflow-x-auto">
              <h1 class="mb-4 text-xl font-extrabold dark:text-white">Choose Sources <small
                  class="m-4 font-semibold text-gray-500 dark:text-gray-400">Choose the Sources that viewers will be
                  able to move</small></h1>
              <table class="min-w-full bg-white">
                <thead>
                  <tr>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Movable?
                    </th>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Source Name
                    </th>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Position
                    </th>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Size
                    </th>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Boundary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in sceneItems.Data.sceneItems" :key="item.sceneItemId" class="hover:bg-gray-50">

                    <!-- Enabled Checkbox -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      <input type="checkbox" v-model="item.twitch_movable"
                        class="form-checkbox checkbox-lg scale-150 h-5 w-5 text-blue-600" />
                    </td>

                    <!-- Source ID -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      {{ item.sceneItemId }}
                    </td>

                    <!-- Source Name -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      {{ item.sourceName }}
                    </td>

                    <!-- Position - X/Y -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      ({{ item.sceneItemTransform.positionX.toFixed(2) }}, {{
                        item.sceneItemTransform.positionY.toFixed(2)
                      }})
                    </td>

                    <!-- Size - Width/Height -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      ({{ item.sceneItemTransform.width }}, {{ item.sceneItemTransform.height }})
                    </td>


                    <!-- Boundary Dropdown -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      <select v-model="item.boundary"
                        class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                        <option disabled value="">Select Boundary</option>
                        <!-- <option v-for="boundary in boundaries" :key="boundary" :value="boundary">
                          {{ boundary }}
                        </option> -->
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <div>
      connectObsStatusMessage: {{ connectObsStatusMessage }}<br />
      bounds: {{ bounds }}<br />
      infoWindowConfig: {{ infoWindowConfig }}<br />
      sceneItems: {{ sceneItems }}<br />
    </div> -->
  </div>
</template>

<style lang="scss">
.home {
  .logo {
    display: block;
    width: 620px;
    height: 280px;
    margin: 10px auto 10px;
  }

  .link {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    margin: 18px auto;

    .btn {
      display: block;
      width: 150px;
      height: 50px;
      line-height: 50px;
      padding: 0 5px;
      margin: 0 30px;
      border-radius: 8px;
      text-align: center;
      font-weight: 700;
      font-size: 16px;
      white-space: nowrap;
      text-decoration: none;
      cursor: pointer;

      &.start {
        background-color: #fd0404;
        color: #ffffff;

        &:hover {
          background-color: #ec2e2e;
        }
      }

      &.star {
        background-color: #ffffff;
        color: #fd0404;

        &:hover {
          background-color: #f3f3f3;
        }
      }
    }
  }
}
</style>
