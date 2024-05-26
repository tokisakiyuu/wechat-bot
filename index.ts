import "dotenv/config";
import { WechatyBuilder, ScanStatus, log, Contact, Message } from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import { ChatBus } from "./chat";

const bot = WechatyBuilder.build({
  name: "YuuBot",
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true,
  },
});

function onScan(qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      "https://wechaty.js.org/qrcode/",
      encodeURIComponent(qrcode),
    ].join("");
    log.info(
      "StarterBot",
      "onScan: %s(%s) - %s",
      ScanStatus[status],
      status,
      qrcodeImageUrl,
    );

    qrcodeTerminal.generate(qrcode, { small: true }); // show qrcode on console
  } else {
    log.info("StarterBot", "onScan: %s(%s)", ScanStatus[status], status);
  }
}

function onLogin(user: Contact) {
  log.info("StarterBot", "%s login", user);
}

function onLogout(user: Contact) {
  log.info("StarterBot", "%s logout", user);
}

const chatBus = new ChatBus();
const launchTimestamp = Date.now();

async function onMessage(msg: Message) {
  log.info("StarterBot", msg.toString());

  const talker = msg.talker();
  const text = msg.text();
  const key = talker.id;

  if (["🥚", "阿蛋"].includes(text)) {
    if (msg.date().getTime() <= launchTimestamp) return;
    const chat = chatBus.newChat(key);
    const responseMsg = await chat.talk("你好");
    const reply = `🥚: ${responseMsg}`;
    if (!msg.self()) {
      await msg.say(reply);
    }
    log.info("BCE_AI", reply);
  } else {
    const chat = chatBus.findChat(key);
    if (!chat) return;
    const responseMsg = await chat.talk(text);
    const reply = `🥚: ${responseMsg}`;
    if (!msg.self()) {
      await msg.say(reply);
    }
    log.info("BCE_AI", reply);
  }
}

bot.on("scan", onScan);
bot.on("login", onLogin);
bot.on("logout", onLogout);
bot.on("message", onMessage);

bot
  .start()
  .then(() => log.info("StarterBot", "Starter Bot Started."))
  .catch((e) => log.error("StarterBot", e));
