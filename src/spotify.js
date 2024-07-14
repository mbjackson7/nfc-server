const spotifyRequest = async (token, url, method, body = null) => {
    options = {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`
        },
    }
    if (body) {
        options.body = body
    }

    try {
        const resp = await fetch(
            url,
            options
        )
        return resp
    } catch(error) {
        console.error('Error:', error)
        return false
    }
}


const spotifyPause = async (token) => {
    resp = await spotifyRequest(token, 'https://api.spotify.com/v1/me/player/pause', 'PUT', '{}')
    return resp.status
}

const spotifyPlay = async (token, uri = null, device_id = null) => {
    params = device_id ? `?device_id=${device_id}` : ''
    body = uri ? JSON.stringify({ 'context_uri': uri }) : '{}'
    resp = await spotifyRequest(token, `https://api.spotify.com/v1/me/player/play${params}`, 'PUT', body)
    if (resp.ok) {
        return 204
    }
    return resp.status
}

const spotifyListDevices = async (token) => {
    resp = await spotifyRequest(token, 'https://api.spotify.com/v1/me/player/devices', 'GET')
    if (resp.status === 200) {
        const data = await resp.json()
        return data
    }
    return resp.status
}


module.exports = {
    spotifyPause, spotifyPlay, spotifyListDevices
}
