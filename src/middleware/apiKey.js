const checkApiKey = (req, res, next) => {
    if (req.query.apiKey === process.env.API_KEY) {
        next()
    } else {
        res.sendStatus(401)
    }
}