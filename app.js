//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect Mongoose to bd server
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Layout for items documents in DB
const itemSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemSchema],
};

// Make collection in database, collection mongo name for table equivalent
const Item = mongoose.model("Item", itemSchema);

const List = mongoose.model("List", listSchema);

// // Make Items to populate db for testing.
const item1 = new Item({
  name: "Keep track of your todo's",
});

const item2 = new Item({
  name: "Click the  +  below to add a new item",
});

const item3 = new Item({
  name: "<-- Check this box to remove",
});

//put items in array to use with Model.inseryMany() from mongoose
const defaultItems = [item1, item2, item3];

// Main list
app.get("/", function (req, res) {
  let day = date.getDate();

  // renderig page in callback of Model.find far better way of waiting for results than using promise
  Item.find((err, results) => {
    if (results.length === 0) {
      Item.insertMany(defaultItems);

      res.render("list", { listTitle: "Today", items: results, Day: day });
    } else {
      res.render("list", { listTitle: "Today", items: results, Day: day });
    }
  });
});

app.get("/:listName", (req, res) => {
  let day = date.getDate();
  const listName = _.capitalize(req.params.listName);
  // check for document with name passed form url and assign to document
  let document;
  List.findOne({ name: listName }, (err, results) => {
    if (err) {
      console.log(`Error finding list ${listName}: ${err}`);
    }
    // if no document  then create and stock with default values
    if (!results) {
      const list = new List({
        name: listName,
        items: defaultItems,
      });
      list.save();
      res.render("list", { Day: day, listTitle: listName, items: list.items });
    } else {
        res.render("list", {
          Day: day,
          listTitle: listName,
          items: results.items,
        });
    }
  });

});

app.post("/", function (req, res) {
  const listName = req.body.list;

  const item = new Item({ name: req.body.newItem });

  if (listName === "Today") {
    item.save();

    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, result) => {
      result.items.push(item);
      result.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItem } } }, (err, foundList) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

// Server
app.listen(3000, function () {
  console.log("Server up and listening on port:3000");
});
