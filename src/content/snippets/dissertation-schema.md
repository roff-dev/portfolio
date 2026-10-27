---
title: "Describing the shop's stock for MongoDB"
project: dissertation
language: js
skill: "Data modelling"
order: 2
---

```js
const Mongoose = require("mongoose");

// Every stock item has the same shape, checked before it's saved
const StockItemSchema = new Mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  points: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  stockId: {
    type: Number,
    required: false
  },
}, { collection: "Stock" });

const Stock = Mongoose.model("stock", StockItemSchema);

module.exports = Stock;
```

**The problem:** MongoDB will store any shape of document you give it, but the app needs every product to have a name, a price, a quantity and the points it earns, or the customer's screen breaks.

**Why this approach:** A Mongoose schema gives the collection the structure the database itself doesn't enforce. Every item is checked against it before it's saved, so a product with no price is rejected by the server instead of turning up half-empty on someone's phone.

**What to notice:** `{ collection: "Stock" }` pins the collection's name. Without it, Mongoose would quietly pluralise the model name and store everything in `stocks`.
