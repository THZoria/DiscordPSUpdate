# DiscordPSUpdate
Discord bot to retrieve new information about PS4/PS5 updates

The project is based on Node JS, which you will need to install: [Node JS](https://nodejs.org/en/download)
The dependencies required for the bot to function properly:
```
- axios
- cheerio
- discord.js
- dotenv
```
You can install them all by running :
```npm install discord.js axios cheerio dotenv```

# Bot configuration: 

To configure the bot, you will need to add a Discord bot token from the Discord developer portal: [Discord Devs](https://discord.com/developers/applications)
You will also need the ID of a Discord channel. To do this, you must put Discord in developer mode and right-click on a Discord room to retrieve its ID
You must add them to the .env file at the root of the script: 
```
# Your Discord bot token (found in the Discord developer portal)
DISCORD_TOKEN=

# Discord server ID where updates should be posted
CHANNEL_ID=
```

