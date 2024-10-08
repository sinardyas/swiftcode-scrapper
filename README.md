# Bank Swiftcode Scrapper

Simple tools to scrape Bank Swiftcode from [theswiftcode.com](https://theswiftcode.com) web

To install dependencies:

```bash
bun install
```

To generate migrations:

```bash
bun db:generate
```

To run the migrations:

```bash
bun db:migrate
```

To fetch country:

```bash
bun run fetch-country
```

To fetch bank:

```bash
bun run fetch-bank
```

To fetch branch:

```bash
bun run fetch-branch
```

To fetch swiftcode:

```bash
bun run fetch-swiftcode
```

This project was created using `bun init` in bun v1.0.33. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
