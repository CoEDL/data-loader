# pdsc-librarybox-installer

A GUI to deploy a PARADISEC collection to a LibraryBox and configure the box for use. This GUI
can also build a static html site on a disk that does not require a webserver to operate.

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
> npm run package
```

## Updating the version of the viewer that gets bundled with the application

This requires the [collection viewer repo](https://github.com/marcolarosa/pdsc-collection-viewer). Download that repo and set it up. Then, follow the notes to [`Deploy it LibraryBox`](https://github.com/marcolarosa/pdsc-collection-viewer#deploy-to-librarybox). This will package up a version
of the viewer suitable for the LibraryBox in the `dist` folder of that repo.

Once complete, copy the files in dist into `/src/viewer/` of this repository. Commit and push the new
version of this repo.

## Building a catalog for LibraryBox Development

[Read the notes here](scripts/README.md).
