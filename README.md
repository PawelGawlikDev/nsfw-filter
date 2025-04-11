# NSFW Filter chrome extension

Built using TypeScript, [TensorFlow.js](https://www.tensorflow.org/js?hl=pl), [WXT](https://wxt.dev) and [NSFWJS](https://github.com/infinitered/nsfwjs).

# Usage

When you load web pages, NSFW Filter will first hide all images and only show those classified as safe.

# Test extension

NSFW:

- https://i.imgur.com/bY536ZM.jpeg
- https://i.imgur.com/y9aPMnm.jpg

SFW:

- http://i.imgur.com/0WkpMWf.jpg
- http://i.imgur.com/0X9OHoH.jpg

# Development

Suggested package menager [PNPM](https://pnpm.io)

Install dependencies by running:

```sh
pnpm install
```

Then build the project:

```sh
pnpm build | pnpm build:firefox
```

To run a development version with live reload, run:

```sh
pnpm dev | pnpm dev:firefox
```

After run dev command next build development version of extension with hot reload and automatically open browser with installed extension.
