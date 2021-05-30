"use strict";

const Base = require("./Base");
const InteractionData = require("./InteractionData");
const Message = require("./Message");
const Member = require("./Member");
const Constants = require("../Constants");
const Endpoints = require("../rest/Endpoints");

/**
* Represents a member's voice state in a call/guild
* @prop {String} applicationId The id of the interaction's application
* @prop {String?} channelId The interaction token
* @prop {InteractionData?} data The data attached to the interaction
* @prop {String?} guildId The id of the guild in which the interaction was created
* @prop {String} id The interaction id
* @prop {Member?} member the member who triggered the interaction
* @prop {Message?} message The message the interaction came from (Message Component only)
* @prop {String} token The interaction token
* @prop {Number} type 1 is a Ping, 2 is a Slash Command, 3 is a Message Component
* @prop {Number} version The interaction version
* 
*/
class Interaction extends Base {
    constructor(data, client) {
        super(data.id);
        this._client = client;

        this.applicationId = data.application_id;
        
        if(data.channel_id) {
            this.channelId = data.channel_id;
        } else {
            this.channelId = null;
        }

        if(data.data) {
            this.data = new InteractionData(data.data);
        } else {
            this.data = null;
        }        

        if(data.guild_id) {
            this.guildId = data.guild_id;
        } else {
            this.guildId = null;
        }

        if(data.member) {
            this.member = new Member(data.member);
        } else {
            this.member = null;
        }

        if(data.message) {
            this.message = new Message(data.message, this._client);
        } else {
            this.message = null;
        }

        if(data.token) {
            this.token = data.token;
        } else {
            this.token = null;
        }

        this.type = data.type
        this.version = data.version
    }

    /**
    * Acknowledges the interaction without replying. (Message Component only)
    * @returns {Promise}
    */
    async acknowledge() {
        this._client.requestHandler.request("POST", Endpoints.INTERACTION_RESPOND(this.id, this.token), true, {
            type: Constants.InteractionResponseType.DEFERRED_UPDATE_MESSAGE
        })
    }

    /**
    * Respond to the interaction
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {String} content.content A content string
    * @arg {Object} [content.embed] An embed object. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [options.file] A file object (or an Array of them)
    * @arg {Buffer} options.file.file A buffer containing file data
    * @arg {String} options.file.name What to name the file
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @arg {Boolean} [content.flags] 64 for Ephemeral
    * @returns {Promise}
    */

    async createFollowup(content) {
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embed && content.flags === undefined) {
                return Promise.reject(new Error("No content, embed or flags"));
            }
            if(content.content !== undefined || content.embed || content.allowedMentions) {
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }
        }
        return this._client.requestHandler.request("POST", Endpoints.WEBHOOK_TOKEN(this.applicationId, this.token), true, {
                content: content.content,
                embeds: content.embeds || [],
                allowed_mentions: content.allowed_mentions || null,
                tts: content.tts,
                flags: content.flags || 0,
        }, content.file)//.then((response) => new Message(response, this)); Errored out?
    }

    /**
    * Respond to the interaction
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {String} content.content A content string
    * @arg {Object} [content.embed] An embed object. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @arg {Boolean} [content.flags] 64 for Ephemeral
    * @returns {Promise}
    */

    async createMessage(content) {
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embed && content.flags === undefined) {
                return Promise.reject(new Error("No content, embed or flags"));
            }
            if(content.content !== undefined || content.embed || content.allowedMentions) {
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }
        }
        return this._client.requestHandler.request("POST", Endpoints.INTERACTION_RESPOND(this.id, this.token), true, {
            type: Constants.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: content.content,
                embeds: content.embeds || [],
                allowed_mentions: content.allowed_mentions || null,
                tts: content.tts,
                flags: content.flags || 0,
            }
        })
    }

    /**
    * Defer response to the interaction
    * @arg {Boolean} [flags] 64 for Ephemeral
    * @returns {Promise}
    */

    async defer(flags) {
        return this._client.requestHandler.request("POST", Endpoints.INTERACTION_RESPOND(this.id, this.token), true, {
            type: Constants.InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: flags || 0,
            }
        })
    }

    /**
    * Defer message update (Message Component only)
    * @returns {Promise}
    */

    async deferUpdate() {
        return this._client.requestHandler.request("POST", Endpoints.INTERACTION_RESPOND(this.id, this.token), true, {
            type: Constants.InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
        })
    }

    /**
    * Edit a past response to the interaction
    * @arg {String} messageId the id of the message to edit, or "@original" for the original response
    * @arg {String | Object} content What to edit the message with
    * @returns {Promise}
    */

    async editResponse(messageId, content) {
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embed && content.flags === undefined) {
                return Promise.reject(new Error("No content, embed or flags"));
            }
            if(content.content !== undefined || content.embed || content.allowedMentions) {
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }
        }
        return this._client.requestHandler.request("PATCH", Endpoints.WEBHOOK_MESSAGE(this.applicationId, this.token, messageId), true, {
            content: content.content,
            embeds: content.embeds || [],
            allowed_mentions: content.allowed_mentions || null,
            flags: flags || 0,
        })
    }

    /**
    * Edit the interaction Message (Message Component only)
    * @arg {String} messageId the id of the message to edit, or "@original" for the original response
    * @arg {String | Object} content What to edit the message with
    * @returns {Promise}
    */

    async edit(content) {
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embed && content.flags === undefined) {
                return Promise.reject(new Error("No content, embed or flags"));
            }
            if(content.content !== undefined || content.embed || content.allowedMentions) {
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }
        }
        return this._client.requestHandler.request("POST", Endpoints.INTERACTION_RESPOND(this.id, this.token), true, {
            type: Constants.InteractionResponseType.UPDATE_MESSAGE,
            data: {
                content: content.content,
                embeds: content.embeds || [],
                allowed_mentions: content.allowed_mentions || null,
            }
        })
    }

}


module.exports = Interaction;
