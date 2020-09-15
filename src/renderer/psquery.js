import { remote } from 'electron'
const PORT = remote.getGlobal('PORT')

const matchErr = text => {
  return (
    parseInt((text.match(/error_code\W+([0-9a-fx]+)/i) || [])[1]) || 0
  ).toString(16)
}

export async function install(device, hash) {
  const { psip, myip } = device
  const q = await fetch(`http://${psip}:12800/api/install`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'direct',
      packages: [`http://${myip}:${PORT}/${hash}`]
    })
  })
  const text = await q.text()
  const match = text.match(/success\W+task_id\W+(\d+)\W+title\W+(\w+)/i)
  if (match) {
    const task_id = parseInt(match[1])
    const title = match[2]
    console.log('[installing]', title, task_id)
    return task_id
  } else {
    throw new Error('code ' + matchErr(text))
  }
}

export async function is_exists(device, title_id) {
  const { psip, myip } = device
  const q = await fetch(`http://${psip}:12800/api/is_exists`, {
    method: 'POST',
    body: JSON.stringify({
      title_id
    })
  })
  const text = await q.text()
  return /exists\W+true/i.test(text)
}

export async function get_progress(device, task_id) {
  const { psip, myip } = device
  const q = await fetch(`http://${psip}:12800/api/get_task_progress`, {
    method: 'POST',
    body: JSON.stringify({
      task_id
    })
  })
  const text = await q.text()
  if (/success/i.test(text)) {
    const match = text.match(
      /length\W+([0-9a-fx]+).*transferred\W+([0-9a-fx]+)/i
    )
    const len = parseInt(match[1])
    const tfd = parseInt(match[2])
    const div = tfd / len
    return Number.isFinite(div) ? div.toFixed(2) : '0'
  } else {
    throw new Error('code ' + matchErr(text))
  }
}

export async function taskManage(device, task_id, task) {
  const { psip, myip } = device
  const q = await fetch(`http://${psip}:12800/api/${task}_task`, {
    method: 'POST',
    body: JSON.stringify({
      task_id
    })
  })
  const text = await q.text()
  return /success/i.test(text)
}
