<template>
  <div class="d-flex">
    <span class="hoverboard pointer" @click="switchPS">
      &nbsp;&#128472;&nbsp;
    </span>
    <h2 v-if="currentDevice" style="flex-grow: 1">
      NAME: {{ currentDevice.name }} | IP: {{ currentDevice.psip }}
    </h2>
    <h2 v-else style="flex-grow: 1">NOT FOUND</h2>
    <span class="circle" :class="{'circle-green': connected}"></span>
  </div>

  <button class="add-button" @click="add">ADD FILE</button>

  <div class="list-item" v-for="f in files" :key="f.hash">
    <div style="flex-grow: 1" :title="f.path">
      {{ f.header }}
      &nbsp;
      <span>{{ normsize(f.filesize) }}</span>
      &nbsp;
      <span v-if="f.is_exists">&#10003;</span>
    </div>
    <div v-if="f.progress">{{ f.progress * 100 }}%</div>
    <div v-else class="play-icon pointer" @click="install(f)">&#9654;</div>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import { get_progress, install, is_exists } from './psquery'

const showError = err =>
  remote.dialog.showErrorBox(err.name || 'Error', err.message || err)

let indicatorFlag = false

export default {
  data: () => ({
    devices: [],
    devicePos: 0,
    files: [],
    connected: false
  }),
  computed: {
    currentDevice() {
      this.checkConnection()
      const realPos = Math.abs(this.devicePos) % this.devices.length
      return this.devices[realPos]
    }
  },
  methods: {
    normsize(value) {
      value = value / 1024 / 1024
      let unit = 'mb'
      if (value > 1000) {
        value = value / 1024
        unit = 'gb'
      }
      return value.toFixed(2) + unit
    },
    add() {
      ipcRenderer.send('add-files')
    },
    switchPS() {
      this.devicePos++
      this.discover()
    },
    checkConnection() {
      this.connected = null
      indicatorFlag = true
      const change = v => {
        if (indicatorFlag) {
          this.connected = v
          indicatorFlag = false
        }
      }
      this.$nextTick(() =>
        is_exists(this.currentDevice, 'CUSA09311')
          .then(() => change(true))
          .catch(() => change(false))
      )
    },
    discover() {
      ipcRenderer.send('discover')
    },
    async install(file) {
      try {
        const task_id = await install(this.currentDevice, file.hash)
        file.task_id = task_id
        const update = async () => {
          file.progress = await get_progress(this.currentDevice, task_id)
          file.progress < 1 && setTimeout(update, 10000)
        }
        update()
      } catch (err) {
        showError(err)
      }
    }
  },
  mounted() {
    this.discover()
    ipcRenderer.on('device', (event, dev) => {
      if (this.devices.find(e => e.psip === dev.psip)) return
      this.devices.push(dev)
      console.log('new divice', dev)
    })
    ipcRenderer.on('new-file', async (event, file) => {
      if (this.files.find(f => f.path === file.path)) return
      try {
        file.is_exists = await is_exists(this.currentDevice, file.title_id)
      } catch (_) {}
      this.files.push(file)
    })
  },
  unmounted() {
    ipcRenderer.removeAllListeners()
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 4px 25px;
  background: #282c34;
  color: #bbc3d3;
  text-shadow: 0 0 5px #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  cursor: default;
}
.list-item {
  padding: 6px 7px;
  border-radius: 5px;
  display: flex;
  align-items: center;
}
.hoverboard {
  margin-right: 10px;
  font-size: 2rem;
  transition: text-shadow 0.5s ease;
}
.hoverboard:hover {
  text-shadow: 0 0 10px rgb(71, 151, 255);
}
.d-flex {
  display: flex;
  align-items: center;
}
.pointer {
  cursor: pointer;
  user-select: none;
}
.circle {
  background: tomato;
  box-shadow: 0 0 10px 4px tomato;
  display: inline-block;
  height: 20px;
  width: 20px;
  border-radius: 50%;
}
.play-icon {
  font-size: 1.5rem;
}
.circle-green {
  background: yellowgreen;
  box-shadow: 0 0 10px 4px yellowgreen;
}
.add-button {
  margin: 0 10px;
  padding: 6px 16px;
  border-radius: 0;
  font-weight: 700;
  color: rgb(35, 35, 48);
  background: #528bff;
  border: 1px;
  box-shadow: none;
  transition: box-shadow 0.1s ease-out;
  cursor: pointer;
}
.add-button:hover {
  box-shadow: 0 0 5px #528bff;
}
.add-button:active {
  box-shadow: 0 0 15px #528bff;
}
.add-button:focus {
  outline: none;
}
</style>
