const args = argv;
const input = args.shift();

const ws = Kernel.extensions.get("WindowServer");
const VFS = Kernel.extensions.get("Vfs");

try {
  Kernel.extensions.get("LibFakeDOM");
} catch (e) {
  input.stdout("We require that LibFakeDOM is installed for this application to be run. thanx uwu\n");
  return;
}

const AsyncFunction = Object.getPrototypeOf(async function miner() {}).constructor;

async function read(path) {
  const data = await fetch(path);
  const dataText = await data.text();

  return dataText;
}

input.stdout("Fetching package path...");
const pkgData = JSON.parse(VFS.read("/etc/pkg/repos.json"));
const path = pkgData["portsroot"].path.replace("rootpkgserver.json", "") + "ports/" + pkgData["portsroot"].contents[0].contents["minecraft"].path;

input.stdout(" [OK]\n");
input.stdout("Downloading main data...");
const data = await read(path.replace("launcher.js", "eags_data/classes.js"));

input.stdout(" [OK]\n");

input.stdout("Starting Minecraft...");

const element = document.createElement("body");
element.id = "game_frame";

const fakeConsole = {
  info:  (...args) => input.stdout(args.join(" ") + "\n"),
  log:   (...args) => input.stdout(args.join(" ") + "\n"),
  warn:  (...args) => input.stdout(args.join(" ") + "\n"),
  error: (...args) => input.stdout(args.join(" ") + "\n")
}

await ws.createWindow(10, 10, async function (canvasElement, update, addEventListener) {
  const fakeDOM = Kernel.extensions.get("LibFakeDOM");
  const { document, window } = fakeDOM(addEventListener);

  console.log(window.location, document.location);

  window.minecraftOpts = [
    "game_frame",
    "eags_data/assets.epk",
    "CgAACQAHc2VydmVycwoAAAABCAACaXAAIHdzKHMpOi8vIChhZGRyZXNzIGhlcmUpOihwb3J0KSAvCAAEbmFtZQAIdGVtcGxhdGUBAAtoaWRlQWRkcmVzcwEIAApmb3JjZWRNT1REABl0aGlzIGlzIG5vdCBhIHJlYWwgc2VydmVyAAA=",
  ];

  document.appendChild(element);

  canvasElement.title = "Minecraft 1.5.2";
  canvasElement.width = 1280;
  canvasElement.height = 720;

  update();

  let funcContents = data
    .replace("worker_bootstrap.js", path.replace("launcher.js", "eags_data/worker_bootstrap.js"))
//  .replace("assets.epk", path.replace("launcher.js", "eags_data/assets.epk"))
    .replace("window.document", "document") + "\n\nmain();";

  input.stdout("    [OK]\n");

  if (args[0] && args[0] == "debug_lulz") {
    input.stdout("Hijacking Eaglercraft...");
    funcContents = funcContents.replace("function ALa(b){", "function ALa(b){console.log('ABSOLUTE PANIC! Reason:', b);");

    input.stdout(" [OK]\n\n");
  }

  const mainHandler = new Function("document", "window", "console", funcContents);
  mainHandler(document, window, fakeConsole);

  const ctx = canvasElement.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 1280, 720);

  let hasCrashed;

  while (true) {
    console.log(document.getElementsByTagName("div"));

    if (document.getElementsByTagName("div")[0].textContent.startsWith("Game Crashed!") && !hasCrashed) {
      input.stdout("\nWARN: Game has reportedly crashed! Reason:\n\n");
      input.stdout(document.getElementsByTagName("div")[0].textContent);
      input.stdout("\n\n");

      console.log("CRITICAL_WARN: Game has crashed!");
      console.log("  Crash log:");
      console.log(document.getElementsByTagName("div")[0].textContent);
      console.log("  Document:");
      console.log(document);

      hasCrashed = true;
    }

    if (document.getElementById("game_frame").getElementsByTagName("canvas") != 0) {
      const canvas = document.getElementById("game_frame").getElementsByTagName("canvas")[0];

      try {
        ctx.drawImage(canvas, 0, 0);
      } catch (e) {
        const img = document.getElementById("game_frame").getElementsByTagName("img");

        for (i of img) {
          console.log(i);
          if (i.src == "data:,") continue;

          ctx.drawImage(i, 0, 0);
        }
      }
    }
    
    await new Promise(i => setTimeout(i, 10));
  }
});