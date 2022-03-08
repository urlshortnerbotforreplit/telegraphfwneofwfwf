require('dotenv').config({
    path: './.env'
});
const TelegramBot = require('node-telegram-bot-api'); //Telegram bot api
const express = require('express'); //For web app to keep the bot alive
const app = express();
app.get("/", (request, response) => {
    response.send("Bot is running!!!");
});

const token = process.env.BOT_TOKEN; //Telegram bot token
const TELEGRAPH_TOKEN = process.env.TELEGRAPH_TOKEN; //Telegraph token

const bot = new TelegramBot(token, {
    polling: true
});

const {
    uploadByUrl
} = require('telegraph-uploader') //Telegraph up by url api
const telegraph = require('telegraph-node');
const {
    timeout
} = require('nodemon/lib/config');
const ph = new telegraph()

//Setting bot commands
bot.setMyCommands([{
        command: '/start',
        description: 'Check if I am alive'
    }],
    [{
        command: '/createAccount',
        description: 'Create a new account on telegraph >>> /createAccount SHORTNAME FULLNAME'
    }],
    [{
        command: '/createPost',
        description: 'Create a new post on telegraph >>> /createPost TITLE | CONTENT'
    }],
    [{
        command: '/editPost',
        description: 'Edit post on telegraph >>> /editPost PATH | TITLE | CONTENT'
    }],
    [{
        command: '/getPost',
        description: 'Get telegraph post by its path >>> /getPost PATH'
    }]
)

// TODO: Fix error message (Follow create post)
// TODO: Add all comands in  bot.on('message', async (msg) => {
// TODO: Add async and await in all functions

// Start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Hello there!!! I am a bot created by @bipuldey19');
});

// Create account
bot.onText(/\/createAccount/, (msg) => {
    var names = msg.text.toString().replace(/createAccount |\//g, '');
    var name = names.split(' ');
    var shortName = name[0];
    var fullNameArray = [];
    for (let j = 1; j < name.length; j++) {
        fullNameArray.push(name[j]);
    }
    var fullName = fullNameArray.join(' ');
    if (name.length > 1) {
        ph.createAccount('hi', {
                short_name: shortName,
                author_name: fullName
            }).then(async (account) => {
                console.log(account)
                var auth = {
                    reply_markup: {
                        "inline_keyboard": [
                            [{
                                "text": "🔐 Verify Account",
                                "url": account.auth_url
                            }]
                        ]
                    },
                    parse_mode: 'Markdown'
                }
                var details = "✅ *Account created Successfully!*\n\n🔰 *Account Details:*\n💠Short Name: " + "_" + account.short_name + "_" +
                    "\n💠Author Name: " + "_" + account.author_name + "_" +
                    "\n💠Access Token: \n" + "`" + account.access_token + "`";
                await bot.sendChatAction(msg.chat.id, 'typing');
                await bot.sendMessage(msg.chat.id, details, auth);
            })
            .catch((err) => {
                bot.sendMessage(msg.chat.id, err);
            })
    } else {
        bot.sendMessage(msg.chat.id, "⚠️ Please give me your Short Name & your Full Name !")
    }

});

// Edit post
bot.onText(/\/editPost/, (msg) => {
    var text = msg.text.toString().replace(/\/editPost |\//g, '');
    var split = text.split(' | ');
    var path = split[0];
    var title = split[1];
    var desc = split[2];
    ph.editPage(TELEGRAPH_TOKEN, path, title, [{
            tag: 'p',
            children: [desc]
        }], {
            return_content: true
        }).then(async (result) => {
            console.log(result)
            var visit = {
                reply_markup: {
                    "inline_keyboard": [
                        [{
                            "text": "🌐 Visit Page",
                            "url": result.url
                        }]
                    ]
                },
                parse_mode: 'Markdown'
            }
            var return_content = "✅ *Telegra.ph post edited Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                "\n💠Path: " + "`" + result.path + "`" +
                "\n💠URL: \n" + "`" + result.url + "`";
            await bot.sendChatAction(msg.chat.id, 'typing');
            await bot.sendMessage(msg.chat.id, return_content, visit);
        })
        .catch((err) => {
            var error = err.split('_').join(' ');
            bot.sendChatAction(msg.chat.id, 'typing');
            bot.sendMessage(msg.chat.id, "⚠️ *Error:*\n\n" + error, {
                parse_mode: 'Markdown'
            })
        });
});


bot.on('message', async (msg) => {

    // Create Post
    if (msg.text.toString().includes('/createPost') && msg.reply_to_message === undefined) {
        await bot.sendMessage(msg.chat.id, "⚙️ Creating Post ...");
        var text = msg.text.toString().replace(/\/createPost |\//g, '');
        var split = text.split(' | ');

        // Default Title
        if (split.length === 1) {
            var desc = split[0];

            // Avoiding empty Post
            if (desc.includes('createPost')) {
                await bot.sendMessage(msg.chat.id, "⚠️ Invalid Request !\n\n❓ See /help");
                return;
            }

            ph.createPage(TELEGRAPH_TOKEN, 'Telegraph Bot', [{
                    tag: 'p',
                    children: [desc]
                }], {
                    return_content: true
                }).then(async (result) => {
                    console.log(result)
                    var visit = {
                        reply_markup: {
                            "inline_keyboard": [
                                [{
                                    "text": "🌐 Visit Page",
                                    "url": result.url
                                }]
                            ]
                        },
                        parse_mode: 'Markdown'
                    }
                    var return_content = "✅ *Telegra.ph post created Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                        "\n💠Path: " + "`" + result.path + "`" +
                        "\n💠URL: \n" + "`" + result.url + "`";
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, return_content, visit);
                })
                .catch((err) => {
                    var error = err.split('_').join(' ');
                    bot.sendChatAction(msg.chat.id, 'typing');
                    bot.sendMessage(msg.chat.id, "⚠️ *Error:*\n\n_" + error + "_\n❓ Get help /help", {
                        parse_mode: 'Markdown'
                    })
                });
        }
        // Custom Title
        if (split.length === 2) {
            var title = split[0];
            var desc = split[1];

            ph.createPage(TELEGRAPH_TOKEN, title, [{
                    tag: 'p',
                    children: [desc]
                }], {
                    return_content: true
                }).then(async (result) => {
                    console.log(result)
                    var visit = {
                        reply_markup: {
                            "inline_keyboard": [
                                [{
                                    "text": "🌐 Visit Page",
                                    "url": result.url
                                }]
                            ]
                        },
                        parse_mode: 'Markdown'
                    }
                    var return_content = "✅ *Telegra.ph post created Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                        "\n💠Path: " + "`" + result.path + "`" +
                        "\n💠URL: \n" + "`" + result.url + "`";
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, return_content, visit);
                })
                .catch(async (err) => {
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, "⚠️ Please give me your Title & your Content !\n⭕ Or see /help")
                });
        }
        if (split.length > 2) {
            bot.sendMessage(msg.chat.id, "⚠️ Invalid Request !\n\n❓ See /help")
        }

    }
    // Create Post with Reply
    if (msg.text.toString().includes('/createPost') && msg.reply_to_message != undefined) {
        await bot.sendMessage(msg.chat.id, "⚙️ Creating Post ...")
        var text = msg.reply_to_message.text.toString();
        var split = text.split(' | ');

        // Default Title
        if (split.length === 1) {
            var desc = split[0];

            ph.createPage(TELEGRAPH_TOKEN, 'Telegraph Bot', [{
                    tag: 'p',
                    children: [desc]
                }], {
                    return_content: true
                }).then(async (result) => {
                    var visit = {
                        reply_markup: {
                            "inline_keyboard": [
                                [{
                                    "text": "🌐 Visit Page",
                                    "url": result.url
                                }]
                            ]
                        },
                        parse_mode: 'Markdown'
                    }
                    var return_content = "✅ *Telegra.ph post created Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                        "\n💠Path: " + "`" + result.path + "`" +
                        "\n💠URL: \n" + "`" + result.url + "`";
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, return_content, visit);
                })
                .catch(async (err) => {
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, "⚠️ Please give me your Title & your Content !\n⭕ Or see /help")
                });
        }
        // Custom Title
        if (split.length === 2) {
            var title = split[0];
            var desc = split[1];

            ph.createPage(TELEGRAPH_TOKEN, title, [{
                    tag: 'p',
                    children: [desc]
                }], {
                    return_content: true
                }).then(async (result) => {
                    console.log(result)
                    var visit = {
                        reply_markup: {
                            "inline_keyboard": [
                                [{
                                    "text": "🌐 Visit Page",
                                    "url": result.url
                                }]
                            ]
                        },
                        parse_mode: 'Markdown'
                    }
                    var return_content = "✅ *Telegra.ph post created Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                        "\n💠Path: " + "`" + result.path + "`" +
                        "\n💠URL: \n" + "`" + result.url + "`";
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, return_content, visit);
                })
                .catch(async (err) => {
                    await bot.sendChatAction(msg.chat.id, 'typing');
                    await bot.sendMessage(msg.chat.id, "⚠️ Please give me your Title & your Content !\n⭕ Or see /help")
                });
        }
        if (split.length > 2) {
            bot.sendMessage(msg.chat.id, "⚠️ Invalid Request !\n\n❓ See /help")
        }
    }
    // Get Post
    if (msg.text.toString().includes('/getPost') && msg.reply_to_message === undefined) {
        await bot.sendMessage(msg.chat.id, "⚙️ Getting Post ...");
        var path = msg.text.toString().replace(/\/getPost |\//g, '');
        ph.getPage(path, {
                return_content: true
            }).then(async (result) => {
                var visit = {
                    reply_markup: {
                        "inline_keyboard": [
                            [{
                                "text": "🌐 Visit Page",
                                "url": result.url
                            }]
                        ]
                    },
                    parse_mode: 'Markdown'
                }
                var return_content = "✅ *Found Telegra.ph post Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                    "\n💠Path: " + "`" + result.path + "`" +
                    "\n💠URL: \n" + "`" + result.url + "`";
                await bot.sendChatAction(msg.chat.id, 'typing');
                await bot.sendMessage(msg.chat.id, return_content, visit);
            })
            .catch(async (err) => {
                await bot.sendMessage(msg.chat.id, `⚠️ Post not found !`)
            });
    }
    // Get Post with Reply
    if (msg.text.toString().includes('/getPost') && msg.reply_to_message !== undefined) {
        await bot.sendMessage(msg.chat.id, "⚙️ Getting Post ...");
        var path = msg.reply_to_message.text.toString();
        ph.getPage(path, {
                return_content: true
            }).then(async (result) => {
                var visit = {
                    reply_markup: {
                        "inline_keyboard": [
                            [{
                                "text": "🌐 Visit Page",
                                "url": result.url
                            }]
                        ]
                    },
                    parse_mode: 'Markdown'
                }
                var return_content = "✅ *Found Telegra.ph post Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + result.title + "_" +
                    "\n💠Path: " + "`" + result.path + "`" +
                    "\n💠URL: \n" + "`" + result.url + "`";
                await bot.sendChatAction(msg.chat.id, 'typing');
                await bot.sendMessage(msg.chat.id, return_content, visit);
            })
            .catch(async (err) => {
                await bot.sendMessage(msg.chat.id, `⚠️ Post not found !`)
            });
    }
    if (msg.text.toString().includes('/test')) {
        await bot.sendMessage(msg.chat.id, "✅ *Test Successfully!*\n\n🔰 *Details:*\n💠Title: " + "_" + "Test" + "_", {
            parse_mode: 'Markdown'
        })
        console.log(msg)
        setTimeout(() => {
            console.log(update.msg.message_id)
        }, 3000);

    }
    // For documents
    if (msg.document != undefined) {
        await bot.sendMessage(msg.chat.id, '⚙️ Uploading file & making links...');
        bot.getFileLink(msg.document.file_id)
            .then(async link => {
                await uploadByUrl(link)
                    .then(async (result) => {
                        var doctype = msg.document.mime_type;
                        var docurl = result.link;
                        var desc = "*✅ File uploaded to telegraph!*\n\n" +
                            "📄 *File Type:* " + doctype + "\n" +
                            "🔗 *Link:*\n" + "`" + docurl + "`";
                        await bot.sendChatAction(msg.chat.id, 'typing');
                        await bot.sendMessage(msg.chat.id, desc, {
                            parse_mode: "Markdown"
                        });
                    })
                    .catch(error => {
                        bot.sendMessage(msg.chat.id, '⚠️ Sorry, I can only upload images, gifs and videos with size less than 5MB !');
                    })
            });
    }
    // For photos
    if (msg.photo != undefined) {
        await bot.sendMessage(msg.chat.id, '⚙️ Uploading image & making links...');
        var links = [];
        var width = [];
        var height = [];
        for (let i = 0; i < msg.photo.length; i++) {
            await bot.getFileLink(msg.photo[i].file_id)
                .then(async link => {
                    await uploadByUrl(link)
                        .then(async (result) => {
                            links.push(result.link);
                        })
                })
                .catch(error => {
                    bot.sendMessage(msg.chat.id, '⚠️ Sorry, I can only upload images, gifs and videos with size less than 5MB !');
                })
            await width.push(msg.photo[i].width);
            await height.push(msg.photo[i].height);
        }
        var desc = "*✅ Image uploaded to telegraph!*\n\n🔗 *Links:*\n\n";
        for (let i = 0; i < links.length; i++) {
            desc += "🖼️ *" + width[i] + "*" + "×" + "*" + height[i] + "*\n" + "`" + links[i] + "`" + "\n\n";
        }

        await bot.sendChatAction(msg.chat.id, 'typing');
        await bot.sendMessage(msg.chat.id, desc, {
            parse_mode: "Markdown"
        });
    }
    // For audio
    if (msg.audio != undefined || msg.voice != undefined) {
        bot.sendMessage(msg.chat.id, '⚠️ Sorry, I can only upload images, gifs and videos with size less than 5MB');
    }

})

app.listen(80)