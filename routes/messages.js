const express = require("express");
const router = new express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const User = require("../models/user");
const Message = require("../models/message");
const ExpressError = require("../ExpressError");
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        let username = req.user.username;
        const message = await Message.get(req.params.id);
        if (message.to_user.username !== username && message.from_user.username !== username) {
            throw new ExpressError("You are not authorized to view this message.", 401);
        }
        return res.json({ message })
    } catch (err) {
        next(err);
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        let from_username = req.user.username;
        let to_username = req.body.to_username;
        let body = req.body.body;
        const message = await Message.create({ from_username, to_username, body });
        return res.json({ message });
    } catch (err) {
        next(err);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        let username = req.user.username;
        const recipientInfo = await Message.get(req.params.id);
        if (recipientInfo.to_user.username !== username) {
            throw new ExpressError("You are not the designated recipient of the message!", 401);
        }
        const message = await Message.markRead(req.params.id);
        return res.json({ message });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

