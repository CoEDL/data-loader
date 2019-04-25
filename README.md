# PARADISEC Repatriation Device Data Loader

- [PARADISEC Repatriation Device Data Loader](#paradisec-repatriation-device-data-loader)
  - [Setup](#setup)
  - [To develop the GUI](#to-develop-the-gui)
  - [Running the tests](#running-the-tests)
  - [To package up a new version](#to-package-up-a-new-version)
  - [Updating the version of the viewer that gets bundled with the application](#updating-the-version-of-the-viewer-that-gets-bundled-with-the-application)

A GUI to deploy a PARADISEC collection to a Raspberry Pi configured as a repatriation device or to build
a static site on a USB disk. A previous version of this application was able to configure a LibraryBox
as a repatriation device though this functionality has since been deprecated as LibraryBox's are no longer
available.

## Setup

You need nodejs installed (version 8 or greater). See [here](https://nodejs.org/en/download/) for what to do for your
system. Once nodejs is setup run `npm install` to install the packages.

## To develop the GUI

```
> npm run develop
```

## Running the tests

```
> npm run test
```

## To package up a new version

```
> npm run build:mac
```

At this stage we are only building for MacOS Clients though it won't require too much to add
Windows and Linux builds.

When complete the packaged version can be found in the `dist/main` folder named something
like `PARADISEC Data Loader-1.0.0-mac.zip`. Rename it to `paradisec-data-loader.zip` and
then scp it to `language-archives.services/srv/downloads`.

## Updating the version of the viewer that gets bundled with the application

This application requires the [mobile collection viewer](https://github.com/marcolarosa/pdsc-collection-viewer-v2). Download that repo and set it up as per those instructions.

Once set up, you can build a version of that viewer for integration into this application by following
the notes Then, follow the notes to `Deploying to the PARADISEC data loader`
