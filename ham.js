const APPS = {
  Bike: {
    appToken: "d28721be-fd2d-4b45-869e-9f253b554e50",
    promoId: "43e35910-c168-4634-ad4f-52fd764a843f",
    event_timeout: 20,
    headers: {},
    event_data: { eventOrigin: "undefined" },
    login_client: { clientOrigin: "deviceid" }
  },
  Clone: {
    appToken: "74ee0b5b-775e-4bee-974f-63e7f4d5bacb",
    promoId: "fe693b26-b342-4159-8808-15e3ff7f8767",
    event_timeout: 120,
    headers: {
      "User-Agent":
        "UnityPlayer/2022.3.28f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "X-Unity-Version": "2022.3.28f1"
    },
    event_data: {
      eventType: "MiniQuest",
      eventOrigin: "undefined"
    },
    login_client: { clientOrigin: "android" }
  },
  Chain: {
    appToken: "d1690a07-3780-4068-810f-9b5bbf2931b2",
    promoId: "b4170868-cef0-424f-8eb9-be0622e8e8e3",
    event_timeout: 20,
    headers: {
      "User-Agent":
        "UnityPlayer/2022.3.20f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "X-Unity-Version": "2022.3.20f1"
    },
    event_data: {
      eventOrigin: "undefined",
      eventType: "cube_sent"
    },
    login_client: { clientOrigin: "android", clientVersion: "1.78.30" }
  },
  Train: {
    appToken: "82647f43-3f87-402d-88dd-09a90025313f",
    promoId: "c4480ac7-e178-4973-8061-9ed5b2e17954",
    event_timeout: 120,
    headers: {
      "User-Agent":
        "UnityPlayer/2022.3.20f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "X-Unity-Version": "2022.3.20f1"
    },
    event_data: {
      eventOrigin: "undefined",
      eventType: "hitStatue"
    },
    login_client: { clientOrigin: "android", clientVersion: "2.4.7" },
    source: "t.me/maratl8"
  }
};

async function makeRequest(url, headers, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });
    if (response.ok) {
      return await response.json();
    } else {
      console.error(
        `HTTP error (${response.status}): ${await response.text()}`
      );
      updateLog(`HTTP error (${response.status})`);
      return null;
    }
  } catch (error) {
    console.error(`Request error: ${error}`);
    updateLog(`Request error: ${error}`);
    return null;
  }
}

function generateClientId(appName) {
  if (["Train", "Clone"].includes(appName)) {
    return [...Array(32)].map(() => Math.random().toString(16)[2]).join("");
  } else if (appName === "Chain") {
    return crypto.randomUUID();
  } else if (appName === "Bike") {
    const randomNumbers = Array.from({ length: 19 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    const timestamp = Date.now();
    return `${timestamp}-${randomNumbers}`;
  }
}

async function login(id, appName) {
  const clientId = generateClientId(appName);
  const data = {
    appToken: APPS[appName].appToken,
    clientId: clientId,
    ...APPS[appName].login_client
  };
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    Host: "api.gamepromo.io"
  };
  const url = "https://api.gamepromo.io/promo/login-client";
  const resJson = await makeRequest(url, headers, data);
  const token = resJson ? resJson.clientToken : null;
  if (token) {
    console.log(`[${id}] Logged in with token: ${token}`);
    updateLog(`[${id}] Logged in with token`);
    return token;
  }
  return null;
}

async function regEvent(token, id, appName) {
  const data = {
    promoId: APPS[appName].promoId,
    eventId: crypto.randomUUID(),
    ...APPS[appName].event_data
  };
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
    Host: "api.gamepromo.io"
  };
  const url = "https://api.gamepromo.io/promo/register-event";
  while (true) {
    const timeout =
      APPS[appName].event_timeout +
      Math.random() +
      Math.floor(Math.random() * 5) +
      1;
    console.log(`[${id}-${appName}] Waiting for ${timeout} seconds...`);
    updateLog(`Играем в игру в [${id}-${appName}] авторизации`);
    await new Promise((resolve) => setTimeout(resolve, timeout * 1000));
    const resJson = await makeRequest(url, headers, data);
    console.log(
      `[${id}-${appName}] API Request Response: ${JSON.stringify(resJson)}`
    );
    if (resJson && resJson.hasCode) {
      await createCode(token, id, appName);
      break;
    }
  }
}

async function createCode(token, id, appName) {
  const data = { promoId: APPS[appName].promoId };
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
    Host: "api.gamepromo.io"
  };
  const url = "https://api.gamepromo.io/promo/create-code";
  const resJson = await makeRequest(url, headers, data);
  const code = resJson ? resJson.promoCode : "Error generating code";
  console.log(`[${id}-${appName}] YOUR CODE: ${code}`);
  allCodes.push(code);
  displayCodes();
}

function displayCodes() {
  const codesDiv = document.getElementById("codes");
  codesDiv.innerHTML = allCodes.map((code) => `<p>${code}</p>`).join("");
  codesDiv.querySelectorAll("p").forEach((p, index) => {
    p.addEventListener("click", () => {
      navigator.clipboard
        .writeText(allCodes[index])
        .then(() => {
          alert("Код скопирован!");
        })
        .catch((err) => {
          console.error("Error copying code: ", err);
        });
    });
  });
}

function updateLog(message) {
  const logDiv = document.getElementById("log");
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.innerText = message;
  logDiv.appendChild(logEntry);
  logDiv.scrollTop = logDiv.scrollHeight;
}

async function main() {
  updateLog("Начало генерации...");
  const keysNeed = 4;
  const tasks = [];
  for (let id = 1; id <= keysNeed; id++) {
    for (const appName of Object.keys(APPS)) {
      const token = await login(id, appName);
      if (token) {
        tasks.push(regEvent(token, id, appName));
      }
    }
  }
  await Promise.all(tasks);
  updateLog("Генерация завершена!");
  document.getElementById("copy-btn").style.display = "block";
}

const allCodes = [];
document.getElementById("generate-btn").addEventListener("click", main);
