import crypto from "crypto";
import os from "os";
import { execSync } from "child_process";

// Get MAC Address
function getMacAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.mac;
      }
    }
  }
  return "unknown-mac";
}

// Get CPU Model & Core Count
function getCpuInfo() {
  const cpus = os.cpus();
  return cpus.length > 0 ? `${cpus[0].model}-${cpus.length}` : "unknown-cpu";
}

// Get Disk Serial Number (Linux & Windows)
function getDiskSerial() {
  try {
    if (os.platform() === "linux") {
      return execSync("lsblk -ndo SERIAL | head -n 1").toString().trim();
    } else if (os.platform() === "darwin") {
      return execSync(
        "ioreg -rd1 -c IOPlatformExpertDevice | awk -F'\"' '/IOPlatformSerialNumber/ {print $4}'"
      )
        .toString()
        .trim();
    } else if (os.platform() === "win32") {
      return execSync("wmic diskdrive get serialnumber")
        .toString()
        .split("\n")[1]
        .trim();
    }
  } catch (error) {
    return "unknown-disk";
  }
}

// Get Motherboard Serial Number (Linux & Windows)
function getMotherboardSerial() {
  try {
    if (os.platform() === "linux") {
      return execSync("cat /sys/class/dmi/id/board_serial").toString().trim();
    } else if (os.platform() === "win32") {
      return execSync("wmic baseboard get serialnumber")
        .toString()
        .split("\n")[1]
        .trim();
    }
  } catch (error) {
    return "unknown-motherboard";
  }
}

// Get OS Info
function getOsInfo() {
  return `${os.type()}-${os.release()}-${os.arch()}`;
}

// Generate Stable Server ID
function generateServerId() {
  const uniqueData = [
    getMacAddress(),
    getCpuInfo(),
    getDiskSerial(),
    getMotherboardSerial(),
    getOsInfo(),
  ].join("|");

  return crypto.createHash("sha256").update(uniqueData).digest("hex");
}

export default generateServerId;
