async function getFieldsTemplateById(headers, body) {
    try {
        const { templateId } = body;
        const endpoint = `https://api.zenvia.com/v2/templates/${templateId}`;
        const { data } = await axios.get(endpoint, { headers });
        return data.fields || [];
      } catch (error) {
        return [];
      }
}

exports.formatHeaders = (headers) => {
    const { token } = headers;
    return {
        'Content-Type': 'application/json',
        'X-API-TOKEN': token
    };
}

exports.formatPayload = async (body, headers) => {
    const { to, from, payload, type } = body;
    const base = {
        from,
        to,
    }
    switch (type) {
        case "text":
            return {
                ...base,
                contents: [{ type: "text", text: payload.text }]
            }
        case "template":
            const fieldsTemplate = await getFieldsTemplateById(
                headers,
                payload,
            )
            let fields = {}
            payload.params.map((param, index) => {
                console.log()
                let fieldName = fieldsTemplate[index] || ''
                fields[fieldName] = param
            });
            return {
                ...base,
                contents: [
                    {
                      type: 'template',
                      templateId: payload.templateId,
                      fields,
                    },
                ],
            }
        case "image":
        case "file":
        case "audio":
        case "video":
            return {
                ...base,
                contents: [
                    {
                      type: 'file',
                      fileUrl: payload.url,
                      fileCaption: payload.caption || '',
                      fileName: payload.filename || '',
                    },
                ],
            }
        default:
            throw new Error("payload unknown")
    }
}