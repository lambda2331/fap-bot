require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const { getConfigs, saveConfigs } = require('./config.service')
const p = require('phin')
const { cities } = require('./cities')
const { search, SEARH_KUFAR, SEARCH_IRR } = require('./api')


let activeAction = null
const CHANGE_CITY_ACTION = 'change_city'
const CHANGE_ROOMS_NUMBER_ACTION = 'change_rooms_number'
const RESET_CONFIG_ACTION = 'reset_config'
const NEXT_APARTMENT_ACTION = 'next_apartment'
let apartments = []
let currentIndex = 0

const namesMap = {
    'city': 'Город',
    'rooms': "Количество комнат"
}

function displayConfigInfo(ctx) {
    ctx.replyWithHTML(`<i><b>Текущие значения:</b></i>\n` + Object.entries(getConfigs()).reduce((text, [key, value]) => (text + `<i>${namesMap[key]} - ${value}</i>\n`), ''))
}

function displayApartmentInfo(ctx, index) {
    const info = apartments[index]
    const text = `<b>${info.text}</b>\n<i>${info.street}</i>\n<i>Цена: ${info.price[0]} (${info.price[1]})</i>\n<i>${info.time}</i>\n<a href="${info.url}">Ссылка</a>`
    ctx.replyWithHTML(text, Markup.inlineKeyboard([
        index <= apartments.length ? [Markup.button.callback('Перейти к следующей', NEXT_APARTMENT_ACTION)] : null
    ]))
}

function processAction(key, callback) {
    bot.action(key, async (ctx) => {
        await ctx.answerCbQuery()
        await callback(ctx)
        activeAction = key
    })
}

function processSearchAction (type) {
    bot.action(type, async ctx => {
        const config = getConfigs()
        const key = cities[config.city]
        if (key) {
            currentIndex = 0
            apartments = await search(type, { config, city: key })
            await ctx.answerCbQuery()
            displayApartmentInfo(ctx, currentIndex)
        }
    })
}

const bot = new Telegraf(process.env.TOKEN)
bot.start((ctx) => {
    ctx.replyWithHTML(`<b>Привет, ${ctx.update.message.from.first_name}!</b>\nТебя приветствует бот по поиску "свежих" квартир.\nВыполни команду /search чтобы начать поиск.\nЛибо выполни /help для просмотра всех доступных команд.`)
})
bot.help((ctx) => {
    const text = 'Я помогу найти тебе квартиру в твоем городе.\n\n<b>Список доступных команд</b>\n/config - Изменить параметры поиска (город, количество комнат)\n/search - Начать поиск квартир с выбором ресурса для поиска'
    ctx.replyWithHTML(text)
})

bot.command('config', async (ctx) => {
    try {
        const config = getConfigs()
        const text =
            `<b>Настройки</b>
Здесь вы можете задать параметры для поиска квартир.
Выберите то, что вы хотите изменить

<i><b>Текущие значения:</b></i>\n` + Object.entries(config).reduce((text, [key, value]) => (text + `<i>${namesMap[key]} - ${value}</i>\n`), '')
        await ctx.replyWithHTML(text, Markup.inlineKeyboard([
            [Markup.button.callback('Город', CHANGE_CITY_ACTION), Markup.button.callback('Количество комнат', CHANGE_ROOMS_NUMBER_ACTION)],
            [Markup.button.callback('Сбросить настройки', RESET_CONFIG_ACTION)]
        ]))
    } catch (error) {
        console.log(error)
    }
})

// Search commands
bot.command('search', async (ctx) => {
    try {
        await ctx.replyWithHTML('Выберите сервис для поиска', Markup.inlineKeyboard([
            [Markup.button.callback('Kufar', SEARH_KUFAR), Markup.button.callback('Из рук в руки', SEARCH_IRR)]
        ]))
    } catch (error) {
        console.log(error)
    }
})

processSearchAction(SEARH_KUFAR)
processSearchAction(SEARCH_IRR)

bot.action(NEXT_APARTMENT_ACTION, async ctx => {
    await ctx.answerCbQuery()
    currentIndex += 1
    if (apartments[currentIndex]) {
        displayApartmentInfo(ctx, currentIndex)
    }
})

// Process config actions
processAction(CHANGE_CITY_ACTION, async (ctx) => await ctx.reply('Введите название города:'))
processAction(CHANGE_ROOMS_NUMBER_ACTION, async (ctx) => await ctx.reply('Введите количество комнат:'))
processAction(RESET_CONFIG_ACTION, async (ctx) => {
    saveConfigs({ city: 'Минск' })
    await displayConfigInfo(ctx)
})

bot.on('text', (ctx) => {
    if (activeAction) {
        const config = {}
        switch (activeAction) {
            case CHANGE_CITY_ACTION: {
                config.city = ctx.message.text
                break
            }
            case CHANGE_ROOMS_NUMBER_ACTION: {
                config.rooms = ctx.message.text
                break
            }
        }
        saveConfigs({ ...getConfigs(), ...config })
        displayConfigInfo(ctx)
    }
})


bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))