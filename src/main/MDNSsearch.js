import { createSocket } from 'dgram'
import { cidrSubnet } from 'ip'
import { networkInterfaces } from 'os'
import { EventEmitter } from 'events'

const msg = Buffer.from(
  '00000000000400000000000001310131033136380331393207696e2d61646472046172706100000c0001023635c00e000c0001023630c00e000c0001023539c00e000c0001',
  'hex'
)

const IPv4Interfaces = Object.values(networkInterfaces())
  .map(a => a.find(e => e.family === 'IPv4'))
  .filter(e => !e.internal)

export class MDNSsearch extends EventEmitter {
  constructor() {
    super()
    this.sock = createSocket('udp4')
    this.sock.on('listening', () => {
      this.sock.setBroadcast(true)
    })

    this.sock.on('message', (msg, rinfo) => {
      const name = (msg.toString('ascii').match(/([\w-]+).local/i) || [])[1]
      // console.log(name)
      if (/ps\d-\w+/i.test(name)) {
        const psip = rinfo.address
        const myip = findmyIPbyLocalIP(rinfo.address)
        this.emit('device', { psip, myip, name })
      }
    })
  }

  search() {
    IPv4Interfaces.forEach(i => {
      const { broadcastAddress } = cidrSubnet(i.cidr)
      this.sock.send(msg, 5353, broadcastAddress)
    })
  }
}

function findmyIPbyLocalIP(localIP) {
  return IPv4Interfaces.find(({ cidr }) => cidrSubnet(cidr).contains(localIP))
    .address
}
