# myfview - A myfile viewer
![NPM Publish](https://github.com/bleonard252/myfview/workflows/NPM%20Publish/badge.svg)

## Installation
In the terminal:
```sh
npm install --save myfview
```
Then, in an Express app:
```js
app.use(require("myfview")({
    "profilePath": "myfview-config/myfiles/", 
        //Myfiles will be looked up from here, followed by .json
    "configPath": "myfview-config/config.json"
        //This is your config file! Most settings are in here and are reloaded upon changes.
}));
```
or in the terminal to test with the built-in server:
```sh
git clone https://github.com/bleonard252/myfview myfview
cd myfview
DEBUG=app node index.js
```

## What does this module do?
myfview hosts myfiles. You can include it on an Express-based website as a middleware. It shows an HTML-based rendering to browsers (so, a webpage) using the Handlebars rendering engine.<!--TODO: add support for more rendering engines --> You can also `curl` the myfile to get a fancy terminal-optimized version, or override it with the `type` query parameter, i.e. `//username?type=json`. You can [read the docs][docs] for more details on what you can do.

## What is a myfile?
A myfile is a simple JSON-based profile used to represent people, objects, places, or anything that can have a name, description (or, in the case of a person, bio), and picture. In fact, there are no required fields, so a myfile can look like this:
```json
{}
```

A more advanced myfile might look like this:
```json
{
    "name": "Blake Leonard",
    "description": "I am the owner of Blogold. I am primarily a web developer.",
    "picture": "https://blogold.xyz/images/logos/avatar4.png",
    "io.keybase.acct": "bleonard252",
    "email": "blake@b252.gq",
    "m.id": "@bleonard252:matrix.org",
    "type": "person",
    "ap:actor": "https://social.b252.gq/users/blake.json",
    "publickey": "...",
    "links": [
        "[Blake's Social](https://social.b252.gq/blake)",
        "[Mastodon](https://mastodon.host/@blakel252)",
        "[Misintelligence](https://bb.blogold.xyz)",
        "[Reddit](https://reddit.com/u/bleonard252)",
        "[More ID's](https://blogold.xyz/id)"
    ]
}
```
(In fact, that's *my* myfile! [see it here](https://blogold.xyz//blake))

## Why does myfview look for "//"?
The URL is actually the myfile address! It follows the general format of [domain]//[username]. The `https://whatever.com` part is the "domain", and the part that identifies the user on that domain is the "username." This syntax means that the profile you're referring to with this address is uniquely a myfile.

Read more about myfiles [here][myfilespec].

[myfilespec]: https://blogold.xyz/product/myfile/docs/
[docs]: https://bleonard252.github.io/myfview/myfview/1.1.0/