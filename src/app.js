const express = require('express')
const nocache = require('nocache')
const fs = require('fs')
const { authorize, authCodeCallback } = require('./middleware/spotifyAuth')
const { spotifyPause, spotifyPlay, spotifyListDevices } = require('./spotify')

const app = express()
const port = 5150

app.use((req, res, next) => {
  console.log('Request:', req.method, req.url)
  next()
})

app.use(nocache())

app.get('/pause', authorize, async (req, res) => {
  res.sendStatus(await spotifyPause(req.access_token))
})

app.get('/play', authorize, async (req, res) => {
  res.sendStatus(await spotifyPlay(req.access_token))
})

app.get('/pay-brat', authorize, async (req, res) => {
  res.sendStatus(await spotifyPlay(req.access_token, 'spotify:album:2lIZef4lzdvZkiiCzvPKj7'))
})

app.get('/pay-brat-on-laptop', authorize, async (req, res) => {
  res.sendStatus(await spotifyPlay(req.access_token, 'spotify:album:2lIZef4lzdvZkiiCzvPKj7', 'put-device-id-here'))
})

app.get('/list-devices', authorize, async (req, res) => {
  res.send(await spotifyListDevices(req.access_token))
})

app.get('/spotify_callback', authCodeCallback)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})