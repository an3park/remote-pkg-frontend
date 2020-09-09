// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
import { createApp } from 'vue'
import App from './App.vue'

const div = document.createElement('div')
document.body.append(div)

createApp(App).mount(div)
