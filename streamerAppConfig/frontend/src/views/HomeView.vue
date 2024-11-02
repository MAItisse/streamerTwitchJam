<script setup lang="ts">

import { onMounted, ref } from 'vue';
import { LoadSecretPy, SaveSecretPy } from '../../wailsjs/go/main/App';

const secretPy = ref({
  "Username": "",
  "Password": "",
})

const testSecretPySuccess = ref("");
const testSecretPyError = ref("");

onMounted(() => {
  LoadSecretPy().then((data) => secretPy.value = data)
})

function submitSecret() {

  SaveSecretPy(secretPy.value).then((res) => {
    if (res == "Saved Successfully!") {
      testSecretPySuccess.value = res;
    } else {
      testSecretPyError.value = res;
    }
  })
}

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
          Save & Test Connection
        </button>
        <div v-if="testSecretPySuccess !== '' || testSecretPyError !== ''" class="flex flex-col">
          <div v-if="testSecretPySuccess !== ''"
            class="w-full margin-auto text-green-500 text-center font-weight-800 text-xl">
            {{ testSecretPySuccess }}</div>
          <div v-if="testSecretPyError !== ''"
            class="w-full margin-auto text-rose-700 text-center font-weight-800 text-xl">
            {{ testSecretPySuccess }}</div>
        </div>
      </form>
    </div>

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
