const router = require('express').Router();
const axios = require('axios');
const { formatPayload, formatHeaders } = require('./zenvia-helpers');

router.post('/send/message', async (req,res) => {
    try {
        const payload = await formatPayload(req.body, req.headers)
        const headers = formatHeaders(req.headers)
        const { data, status } = await send(headers, payload);
        res.json({ data, status });
        res.status(200);
    } catch (error) {
        res.json({ data: error.message });
        res.status(500);
    }
});


async function send(headers, body) {
    const endpoint = "https://api.zenvia.com/v2/channels/whatsapp/messages";
    return axios.post(endpoint, body, { headers });
}

module.exports = router;