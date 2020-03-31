You want to make your myfiles available. Good for you!

## Prerequisites
* An Express.js-based application
* Myfiles ending in ".json" (this is currently a Node requirement and may be removed in the future)
in a special myfiles folder (such as the default, "$PWD/myfview-config/myfiles/")
* The Node package manager (npm. You probably have it)

## Instructions
1. Add myfview to your package:
```sh
npm install --save myfview
```
2. Go into your Express app's code and add this:
```js
app.use(require("myfview")({}))
```
3. Modify the above code to your requirements (i.e. change `app` or move the `require`). Inside of `{}`, you can add objects from {@link options}.
4. If you choose to have a config (see {@link options.configPath}), create the file you pointed to and add the fields from {@link config} to it. (Hint: it's a json file!) By default, the config path is "$PWD/myfview-config/config.json".
5. If you want to edit the templates, copy them from the [repository](https://github.com/bleonard252/myfview/tree/master/views) or the "node_modules" directory/folder npm installed myfview to (should be "$PWD/node_modules/myfview/views") to the path you set in {@link config.templatesPath}. Edit to your heart's content!<br/> HINT: <!--By default,--> myfview uses [Handlebars](https://handlebarsjs.com/guide/). That's the templating engine we use to make the web and cURL pages.

Now you can start up your development server and test your myfiles! It's "[url to your server]//[filename without .json]".