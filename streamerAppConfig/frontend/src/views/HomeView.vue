<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { marked } from "marked";
import { LoadSecretPy, SaveSecretPy, GetWindowConfig, GetInfoWindowConfig, GetSceneItems, ConnectOBS, GetVideoOutputScreenshot, WriteInfoWindowConfig, WriteWindowConfig } from '../../wailsjs/go/main/App';
import StatusMessage from '@/components/StatusMessage.vue';
import PreviewWindow from '@/components/PreviewWindow.vue';
import { types } from '../../wailsjs/go/models';

type StatusMessage = {
  Status: string,
  Message: string,
  Data: any,
};

type Bound = {
  key?: string,
  left: number,
  top: number,
  right: number,
  bottom: number
}

// type WindowConfigFile = {
//   bounds: {
//     [key: string]: Bound
//   }
// }

// type WindowInfoConfigFile = {
//   infoWindow: {
//     [key: string]: {
//       title: string;
//       description: string;
//     };
//   };
// };


const secretPy = ref({
  "Username": "",
  "Password": "",
})

const savePasswordStatusMessage = ref();
const saveConfigStatusMessage = ref();
const connectObsStatusMessage = ref();
const bounds = ref();
const uniqueBounds = ref();
const infoWindowConfig = ref();
const sceneItems = ref();
const obsScreenshot = ref("");
const obsPreviewSourceSelect = ref("");
const finalSaveStatusMessage = ref();
const finalSaveCount = ref(0);

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

onMounted(() => {
  LoadSecretPy().then((data) => secretPy.value = data)
})

// function submitSecret() {
//   SaveSecretPy(secretPy.value).then((res) => {
//     savePasswordStatusMessage.value = res;
//   })
// }

function connectObs() {
  SaveSecretPy(secretPy.value).then((res) => {
    // Connect to OBS
    ConnectOBS().then((res) => {
      connectObsStatusMessage.value = res
      if (res.Status == "error") {
        return;
      }

      // Get bounds
      GetWindowConfig().then((res) => {
        console.log("GetBounds response:", res)
        bounds.value = res


        if (bounds.value.Data.bounds == null) {
          bounds.value.Data.bounds = [];
        }
        console.log(bounds.value.Data);
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
        if (uniqueBounds.value.length == 0) {
          addBoundary();
        }
        console.log("uniqueBounds = ", uniqueBounds.value)
      });

      // Get existing infoWindowConfig
      GetInfoWindowConfig().then((res) => {
        console.log("GetInfoWindowConfig response:", res);
        infoWindowConfig.value = res

        // Get "Scene" sceneItems
        GetSceneItems().then((res) => {
          console.log("GetSceneItems response:", res);
          for (let item of res.Data.sceneItems) {
            console.log("item.sceneItemId: ", item.sceneItemId); //, typeof item.sceneItemId, item.sceneItemId in infoWindowConfig.value.Data.infoWindow);

            item.twitch_movable = (item.sceneItemId in infoWindowConfig.value.Data.infoWindow);
            item.info_title = infoWindowConfig.value.Data.infoWindow[item.sceneItemId]?.title || "";
            item.info_description = infoWindowConfig.value.Data.infoWindow[item.sceneItemId]?.description || "";
            item.boundary_key = "";

          }
          sceneItems.value = res
          console.log("done getting infowindowconfig");
        })
      })
    });
  });
}

const enabledSceneItems = computed(() => {
  if (!sceneItems?.value?.Data?.sceneItems) {
    return {}
  }
  return sceneItems.value.Data.sceneItems.filter((item: any) => item.twitch_movable == true);
});

function loadPreviewScreenshot() {
  // Get OBS screenshot
  GetVideoOutputScreenshot(obsPreviewSourceSelect.value).then((res) => {
    console.log("GetVideoOutputScreenshot response:", res.Data.imageData || null);
    obsScreenshot.value = res.Data.imageData;
  });
}

function addBoundary() {
  console.log("addBoundary");
  const newBound: Bound = {
    key: makeid(8),
    left: 0.25,
    top: 0.25,
    right: 0.75,
    bottom: 0.75
  }
  uniqueBounds.value.push(newBound);
  console.log("boundary added");
}

function removeBoundary(key: string) {
  console.log("removeBoundary() ", key)
  uniqueBounds.value = uniqueBounds.value.filter((bound: any) => bound.key != key);
}

function toggleSceneItem(item: any) {
  console.log("toggleSceneItem: ", item)

  if (item.twitch_movable) {
    if (item.sceneItemId in infoWindowConfig.value.Data.infoWindow === false) {
      infoWindowConfig.value.Data.infoWindow[item.sceneItemId] = {
        title: "",
        description: ""
      }
    }
  }
}

const updateUniqueBounds = (newBounds: object) => {
  console.log("Updating boundaries... ", newBounds)
  uniqueBounds.value = newBounds;
};

function saveConfig() {
  console.log("saveConfig");
  const enabledSceneItems = sceneItems.value.Data.sceneItems.filter((item: any) => item.twitch_movable == true);
  console.log("saveConfig(): enabledSceneItems: ", enabledSceneItems);

  /// windowConfig.json
  /* 
    {
      "bounds": {
        "84": {
          "left": 0.25,
          "top": 0,
          "right": 1,
          "bottom": 0.75
        }
      }
    }
  */
  let wcf: types.WindowConfig = new types.WindowConfig();
  wcf.bounds = {};
  for (let ind in enabledSceneItems) {
    const val = enabledSceneItems[ind];
    console.log("sceneItem: ind:", ind, "val:", val.boundary_key);
    console.log("uniqueBounds.value = ", uniqueBounds.value);

    // find the Bound by key
    const bound = uniqueBounds.value.find((e: any) => e.key === val.boundary_key);
    if (!bound) {
      console.log("missing bound!");
      saveConfigStatusMessage.value = {
        Status: "error",
        Message: "Missing bounds for: " + val.sourceName
      };
      return
    }

    console.log("found the bound: ", bound);
    console.log("wcf.bounds = ", wcf.bounds);
    wcf.bounds['' + val.sceneItemId] = {
      top: bound.top,
      left: bound.left,
      right: bound.right,
      bottom: bound.bottom
    }
    console.log("after new entry: ", wcf.bounds['' + val.sceneItemId]);
  }

  // infoWindowConfig.json
  /*
    {
      "infoWindow": {
        "99": {
            "title": "Git gif",
            "description": "This is a gif you can set from [github](https://github.com/MatissesProjects/GenerateImage)"
        }
      }
    }
  */

  let wicf: types.InfoWindowData = new types.InfoWindowData;
  wicf.infoWindow = {};
  for (let key in enabledSceneItems) {
    const val = enabledSceneItems[key];
    console.log("sceneItem: ind:", key, "val:", val);

    wicf.infoWindow['' + val.sceneItemId] = {
      title: val.info_title,
      description: val.info_description
    }
  }

  finalSaveStatusMessage.value == null;
  finalSaveCount.value = 0;

  // Save to disk
  console.log("Calling WriteInfoWindowConfig with:", wicf);
  WriteInfoWindowConfig(wicf).then((res) => {
    console.log("WriteInfoWindowConfig:", res);

    if (res.Status == "error") {
      finalSaveCount.value -= 30;
    } else if (res.Status == "success") {
      finalSaveCount.value += 1;
    }

    setSaveSuccessMessage();

  });
  console.log("Calling WriteWindowConfig with:", wcf);
  WriteWindowConfig(wcf).then((res) => {
    console.log("WriteWindowConfig:", res);

    if (res.Status == "error") {
      finalSaveCount.value -= 10;
    } else if (res.Status == "success") {
      finalSaveCount.value += 1;
    }

    setSaveSuccessMessage();
  });

}

function setSaveSuccessMessage() {
  if (finalSaveCount.value > 0) {
    let msg: StatusMessage = {
      Status: "success",
      Message: "Saved configurations Successfully!",
      Data: null
    }

    finalSaveStatusMessage.value = msg

    setTimeout(() => {
      finalSaveStatusMessage.value = null;
      finalSaveCount.value = 0
    }, 10000);
  } else {
    // something happened
    let msg: StatusMessage = {
      Status: "error",
      Message: "Something went wrong (Error Code: " + finalSaveCount.value + ")",
      Data: null
    }
    finalSaveStatusMessage.value = msg
  }

}

function renderMarkdown(title: string, description: string) {
  let markdownData = `
## ${title}

${description}`;
  return marked.parse(markdownData || "");
}

</script>

<template>
  <header class="bg-white mb-6 py-6 shadow-md">
    <div class="max-w-lg mx-auto text-center">
      <h1
        class="inline-block px-6 py-3 bg-gray-100 rounded-full text-4xl font-extrabold text-gray-800 tracking-wide shadow-sm">
        Chat Plays <span class="text-blue-600">OBS</span>
      </h1>
    </div>
  </header>
  <div class="home">
    <div v-if="!connectObsStatusMessage"
      class="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg max-w-md mx-auto">
      <form class="w-full space-y-4">

        <!-- OBS Password Row -->
        <div class="flex flex-col">
          <label for="obsPassword" class="mb-1 text-sm font-medium text-gray-700">OBS WebSocket Server Password</label>
          <input id="obsPassword" v-model="secretPy.Password" type="password"
            placeholder="Enter your OBS WebSocket Password"
            class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Twitch Username Row -->
        <div class="flex flex-col">
          <label for="twitchUsername" class="mb-1 text-sm font-medium text-gray-700">Twitch Username</label>
          <input id="twitchUsername" v-model="secretPy.Username" type="text" placeholder="Enter your Twitch username"
            class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Connect Button -->
        <StatusMessage v-if="savePasswordStatusMessage" :status-message="savePasswordStatusMessage"></StatusMessage>
      </form>
      <button type="button" @click="connectObs"
        class="w-full m-4 px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition active:scale-[.95]">
        Connect to OBS
      </button>
      <StatusMessage v-if="connectObsStatusMessage" :status-message="connectObsStatusMessage"></StatusMessage>
    </div>

    <!-- Setup boundaries -->
    <div v-if="connectObsStatusMessage && connectObsStatusMessage.Status == 'success'" class="p-4">
      <StatusMessage v-if="connectObsStatusMessage" :status-message="connectObsStatusMessage"></StatusMessage>
      <div class="flex flex-col mt-4 items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg mx-auto">
        <div class="w-full">
          <div v-if="bounds">
            <div class="overflow-x-auto">
              <h1 class="mb-4 text-xl font-extrabold dark:text-white">Setup Screen Boundaries <small
                  class="m-4 font-semibold text-gray-500 dark:text-gray-400">Users can't move OBS Sources outside of
                  their
                  assigned boundaries</small></h1>
              <div>
                <button type="button" @click="addBoundary"
                  class="m-4 px-4 py-2 font-semibold text-white bg-green-500 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition active:scale-[.95]">
                  Add new Boundary
                </button>
                <table class="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th
                        class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        #</th>
                      <th
                        class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Top</th>
                      <th
                        class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Left</th>
                      <th
                        class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Right</th>
                      <th
                        class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Bottom</th>
                      <th
                        class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      </th>
                    </tr>
                  </thead>
                  <transition-group name="fade" tag="tbody">
                    <tr v-for="(bound, ind) in uniqueBounds" :key="bound.key" class="hover:bg-gray-50 fade-row">

                      <td class="px-6 py-4 text-lg font-bold border-b border-gray-200">
                        {{ ind + 1 }}
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
                        <button type="button" v-if="uniqueBounds.length > 1" @click="() => removeBoundary(bound.key)"
                          class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-md px-2.5 py-1 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 transition active:scale-[.95]">X</button>
                      </td>
                    </tr>
                  </transition-group>
                </table>
              </div>
              <div class="flex justify-center">
                <div>
                  <div class="display-inline p-2">
                    Select your main display source:
                    <select v-if="sceneItems?.Data?.sceneItems" v-model="obsPreviewSourceSelect"
                      class="border-gray-300 py-4  rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                      <option disabled value="">Select Source</option>
                      <option v-for="source in sceneItems.Data.sceneItems" :value="source.sourceName">
                        {{ source.sourceName }}
                      </option>
                    </select>
                    <button type="button" @click="loadPreviewScreenshot"
                      class="m-4 px-4 py-0.5 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition active:scale-[.95]">
                      Load Screenshot
                    </button>
                  </div>
                  <PreviewWindow :videoWidth="1920" :videoHeight="1080" :boundaries="uniqueBounds"
                    @update:uniqueBounds="updateUniqueBounds" :bgImage="obsScreenshot" />
                </div>
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
                  class="m-4 font-semibold text-gray-500 dark:text-gray-400">Choose which OBS Sources that users will be
                  able to move</small></h1>
              <table class="min-w-full bg-white">
                <thead>
                  <tr>

                    <!-- <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th> -->
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Source Name
                    </th>
                    <!-- <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Position
                    </th>
                    <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Size
                    </th> -->
                    <th class="px-6 py-3 w-30 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Moveable?
                    </th>
                    <th class="px-6 py-3 w-60 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                      Boundary
                    </th>
                  </tr>
                </thead>
                <tbody>

                  <tr v-for="item in sceneItems.Data.sceneItems" :key="item.sceneItemId"
                    :class="{ 'hover:bg-gray-50': true, 'bg-amber-100': item.twitch_movable, 'hover:bg-amber-50': item.twitch_movable }">

                    <!-- Source ID -->
                    <!-- <td class="px-6 py-4 border-b border-gray-200">
                      {{ item.sceneItemId }}
                    </td> -->

                    <!-- Source Name -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      {{ item.sourceName }}
                    </td>

                    <!-- Position - X/Y -->
                    <!-- <td class="px-6 py-4 border-b border-gray-200">
                      ({{ item.sceneItemTransform.positionX.toFixed(2) }}, {{
                        item.sceneItemTransform.positionY.toFixed(2)
                      }})
                    </td> -->

                    <!-- Size - Width/Height -->
                    <!-- <td class="px-6 py-4 border-b border-gray-200">
                      ({{ item.sceneItemTransform.width }}, {{ item.sceneItemTransform.height }})
                    </td> -->

                    <!-- Enabled Checkbox -->
                    <td class="px-6 py-4 border-b border-gray-200">
                      <input type="checkbox" v-model="item.twitch_movable" @change="toggleSceneItem(item)"
                        class="form-checkbox checkbox-lg scale-150 ml-4 h-5 w-5 text-blue-600 transition active:scale-[.95]" />
                    </td>

                    <!-- Boundary Dropdown -->
                    <td class="px-6 py-4 border-b border-gray-200"
                      :class="{ 'bg-red-300': !item.boundary_key && item.twitch_movable }">
                      <select v-if="item.twitch_movable" v-model="item.boundary_key"
                        class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                        <option disabled value="">Select Boundary</option>
                        <option v-for="(bound, ind) in uniqueBounds" :key="bound.key" :value="bound.key">
                          #{{ ind + 1 }}
                        </option>
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

    <div v-if="infoWindowConfig && infoWindowConfig.Status == 'success'" class="p-4">
      <div class="flex flex-col mt-4 p-6 bg-gray-100 rounded-lg shadow-lg mx-auto">

        <h1 class="mb-4 text-xl font-extrabold dark:text-white">Setup Info Cards<small
            class="m-4 font-semibold text-gray-500 dark:text-gray-400">These info cards only appear when a viewer
            hovers over a moveable source on your stream
          </small></h1>

        <div class="items-center justify-center bg-gray-100 rounded-lg mx-auto">
          <table class="w-full table-fixed">
            <thead>
              <tr>
                <th class="w-1/2 p-4 text-left border border-gray-300">Popup Details</th>
                <th class="w-1/2 p-4 text-left border border-gray-300">Preview</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, key) in enabledSceneItems" :key="key" class="border-b border-gray-200 fade-row">
                <td class="p-4 pt-6 space-y-2 bg-gray-200 border border-gray-400">
                  <div class="text-2xl font-bold">
                    {{ item.sourceName }}<br />
                  </div>
                  <!-- Title Input -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input v-model="item.info_title" type="text" class="w-full p-2 border border-gray-300 rounded"
                      placeholder="Enter title" />
                  </div>

                  <!-- Description Textarea -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea v-model="item.info_description" class="w-full p-2 border border-gray-300 rounded" rows="4"
                      placeholder="Enter description in Markdown"></textarea>
                  </div>
                </td>

                <td class="p-4 border border-gray-400 bg-gray-300">
                  <div v-html="renderMarkdown(item.info_title, item.info_description)"
                    class="ml-4 w-64 p-4 bg-white border border-gray-300 rounded-lg shadow-lg prose prose-sm max-w-none">
                  </div>
                </td>

              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div v-if="connectObsStatusMessage && connectObsStatusMessage.Status == 'success'" class="w-50 pl-32 pr-32 mb-12">
      <button type="button" @click="saveConfig"
        class="w-full m-2 px-4 py-4 font-bold text-2xl text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-800 transition active:scale-[.98]">
        Save Config!
      </button>
      <StatusMessage v-if="finalSaveStatusMessage" :status-message="finalSaveStatusMessage"></StatusMessage>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-30px);
  /* Slide-in effect */
}

.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-100px);
  /* Slide-out effect */
}
</style>
