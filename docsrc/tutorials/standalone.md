Since myfview is built to be run as an Express middleware, you need Express to run it. Luckily, if you want to run myfview all by itself (i.e. to test it), or with a static/built website, you can use the built-in server.

## Keep in mind
The middleware uses the default options! This means:
* The {@link config config.json} is at "$PWD/myfview-config/config.json".
* The myfiles should be put under "$PWD/myfview-config/myfiles/" with a .json extension (this may be removed in the future).
* Static/built files should be put under "$PWD/myfview-config/static/". This includes any index.html files or whatever. Websites built with i.e. Jekyll should be put here, with an index.html or index.htm available.

## Prerequisites
* git
* npm and nodejs

## Instructions
1. In your command prompt or terminal, do one of the following:
   * Go to an empty folder you want to install myfview to and run this (notice the trailing period):
   ```sh
   git clone https://github.com/bleonard252/myfview.git .
   ```
   * If you want git to create a folder for you, exclude the period at the end and run `cd myfview` to enter the folder.
   * Run `npm install -g myfview`. This will let you run myfview anywhere. **This is the easiest method,** but you may need administrator access to use it. Also, for now you'll have to copy the templates from the [repository](https://github.com/bleonard252/myfview/tree/master/views) online.
2. If you didn't do the `npm` option above, make sure you're in the myfview folder, then run:
   ```sh
   npm install --dev
   ```
3. In that folder, make sure you have the needed configuration structure. This should work:
   ```sh
   mkdir myfview-config
   mkdir myfview-config/myfiles
   mkdir myfview-config/static
   ```
4. Make the `myfview-config/config.json` file as you'd prefer. Make sure it's JSON formatted and uses the fields shown in {@link config}.
5. Now you can start it! Run one of the following:
   * `DEBUG=app node index.js` if you `git clone`d
   * `DEBUG=app myfview` if you `npm install -g`'d

If you did it right, you'll have a web server up and running with myfview!