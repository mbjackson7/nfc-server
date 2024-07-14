const fs = require('fs')

const tokenCache = {
    access_token: '',
    expires: 0,
    refresh_token: ''
}
let userTarget = ''

const authCodeFlow = async (req, res) => {
    const client_id = process.env.SPOTIFY_CLIENT_ID
    const redirect_uri = `${process.env.ORIGIN}/spotify_callback`
    const state = Math.random().toString(36).substring(7)
    const scope = 'user-read-playback-state user-modify-playback-state'
    console.log('Redirecting to Spotify for authorization')
    res.redirect(
        `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&state=${state}&scope=${scope}`
    )
}

const authCodeCallback = async (req, res) => {
    const client_id = process.env.SPOTIFY_CLIENT_ID
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET
    const redirect_uri = `${process.env.ORIGIN}/spotify_callback`

    if (!req.query.state) {
        console.error('Error:', req.query.error)
        res.sendStatus(401)
        return
    }

    const formMap = {
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: redirect_uri
    }
    const formBody = Object.keys(formMap).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(formMap[key])).join('&')
    console.log('Form body:', formBody)

    const resp = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
            },
            body: formBody
        }
    )
    if (resp.status === 200) {
        const data = await resp.json()
        tokenCache.access_token = data.access_token
        tokenCache.expires = Date.now() + data.expires_in * 1000
        tokenCache.refresh_token = data.refresh_token
        // write refresh token to a file
        fs.writeFile('refresh_token.txt', data.refresh_token, (err) => {
            if (err) {
                console.error('Error:', err)
            }
        })

        console.log ('Redirecting to original target:', userTarget)
        res.redirect(userTarget)
    } else {
        console.error('Error:', resp.body)
        res.sendStatus(resp.status)
    }
}

const refreshToken = async () => {
    client_id = process.env.SPOTIFY_CLIENT_ID
    client_secret = process.env.SPOTIFY_CLIENT_SECRET

    try {
        const respRefresh = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
                },
                body: `grant_type=refresh_token&refresh_token=${tokenCache.refresh_token}`
            }
        )
        if (respRefresh.status === 200) {
            const data = await respRefresh.json()
            tokenCache.access_token = data.access_token
            tokenCache.expires = Date.now() + data.expires_in * 1000
            return data.access_token
        }
    } catch(error) {
        console.error('Error:', error)
    }
}

const authorize = async (req, res, next) => {
    if (tokenCache.expires > Date.now()) {
        req.access_token = tokenCache.access_token
        next()
        return
    }
    if (!tokenCache.refresh_token) {
        try {
            tokenCache.refresh_token = fs.readFileSync('refresh_token.txt', 'utf8')
        } catch {}
    }
    if (tokenCache.refresh_token) {
        req.access_token = await refreshToken()
        if (req.access_token) {
            next()
            return
        }
    }
    
    userTarget = req.url
    authCodeFlow(req, res)
}

module.exports = { authorize, authCodeCallback }
