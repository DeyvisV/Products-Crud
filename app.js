var express = require('express');
var mongoose = require('mongoose');
//para lo parametros  que viene del post
var bodyParser = require('body-parser');
var multer = require('multer');
var cloudinary = require('cloudinary');
var method_override = require('method-override');
var Schema = mongoose.Schema;

cloudinary.config({
    cloud_name: "my-tests",
    api_key: "549758536896394",
    api_secret: "BD99-T8nZf_G20sN2tA9RFBvfLw"
});

var app = express();

mongoose.connect("mongodb://localhost/food_facilito");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({dest:'./uploads/'}).single('image'));
app.use(method_override("_method"));

//Definir Schema
var productSchemaJSON = {
    title:String,
    description:String,
    imageUrl:String,
    price:Number
};

var productSchema = new Schema(productSchemaJSON);

productSchema.virtual("image.url").get(function(){
    if (this.imageUrl === "" || this.imageUrl === "data.png") {
        return "default.jpg"; 
    }

    return this.imageUrl;
});

var Product = mongoose.model("Product", productSchema);

app.set("view engine", "jade");

app.use(express.static('public'));



//***Rutas***//

app.get("/", function(solicitud, respuesta){
    respuesta.render("index");
});

// Login
app.get("/admin", function(solicitud, respuesta){
    respuesta.render("admin/form");
});

app.post("/admin", function(solicitud, respuesta){
    if (solicitud.body.password == "123456") {
        Product.find(function(error, document){
            if (error) {
                console.log(error);
            }
            respuesta.render("admin/index", {products: document});
        });
    }
    else {
        respuesta.redirect("/");
    }
    
});

// Index
app.get("/menu", function(solicitud, respuesta){
    Product.find(function(error, document){
        if (error) {
            console.log(error);
        }
        respuesta.render("menu/index", {products: document});
    });
});

// Create
app.get("/menu/new", function(solicitud, respuesta){
    respuesta.render("menu/new");
});

app.post("/menu", function(solicitud, respuesta){

    if (solicitud.body.password == "123456") {
        var data = {
            title: solicitud.body.title,
            description: solicitud.body.description,
            price: solicitud.body.price
        }

        var product = new Product(data);

        if (solicitud.file == null) {
            product.save(function(err){
                console.log(product);
                respuesta.redirect("/menu");
            });
        }
        else {
            cloudinary.uploader.upload(solicitud.file.path, function(result) { 
                    product.imageUrl = result.url;
                    product.save(function(err){
                        console.log(product);
                        respuesta.redirect("/menu");
                    });
                }
            );
        }
    }
    else {
        respuesta.render("menu/new");
    }
});

// Update
app.get("/menu/edit/:id", function(solicitud, respuesta){
    var id_producto = solicitud.params.id

    Product.findOne({"_id": id_producto}, function(error, producto) {
        respuesta.render("menu/edit", {product: producto});
    });
    
});

app.put("/menu/:id", function(solicitud, respuesta){

    if (solicitud.body.password == "123456") {
        var data = {
            title: solicitud.body.title,
            description: solicitud.body.description,
            price: solicitud.body.price
        }

        if ( solicitud.file != null) {
            cloudinary.uploader.upload(solicitud.file.path, function(result){
                data.imageUrl = result.url;
                Product.update({"_id": solicitud.params.id}, data, function(product) {
                        respuesta.redirect("/menu");
                    });
            });
        } 
        else {
            Product.update({"_id": solicitud.params.id}, data, function(product) {
                respuesta.redirect("/menu");
            });
        }
            
    }
    else {
        respuesta.redirect("/");
    }
});

//Delete
app.get("/menu/:id/delete", function(solicitud, respuesta){
    var id = solicitud.params.id;

    Product.findOne({"_id": id}, function(error, producto) {
        respuesta.render("menu/delete", {product: producto});
    });
});

app.delete("/menu/:id", function(solicitud, respuesta){
    var id = solicitud.params.id;
    if (solicitud.body.password == "123456") {
        Product.remove({"_id": id}, function(error) {
            if (error) {console.log(error);}
            respuesta.redirect("/menu");
        });
    }
    else {
        respuesta.redirect("/");
    }
});

// Puerto
app.listen(3000);