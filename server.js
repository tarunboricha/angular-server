import express from "express";
import mysql from "mysql";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
  credentials: true,
  origin: "*"
}));

app.use(express.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tarun",
});

connection.connect((error) => {
  if (error) {
    throw error;
  }
  else {
    console.log("Node js server is connected to Online MySQL server");
  }
});


app.get("/products", (request, response) => {
  const sql_query = "SELECT * FROM products;"

  connection.query(sql_query, (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  })
})

app.get("/popular_products", (request, response) => {
  const sql_query = "INSERT INTO visitors VALUES ();"
  connection.query(sql_query, (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
})

app.get("/trending_products", (request, response) => {
  const sql_query = "SELECT * FROM products WHERE trending = TRUE;"

  connection.query(sql_query, (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.get("/similar_products/:ptype/:id", (request, response) => {
  let productType = request.params.ptype;
  let pid = request.params.id;
  const sql_query = "SELECT * FROM products WHERE productType = ? AND id <> ? ORDER BY RAND() LIMIT 4;";

  connection.query(sql_query,[productType, pid], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.post("/products", (request, response) => {
  request.header("ngrok-skip-browser-warning", "69420");
  const sql_query = "INSERT INTO products VALUES (?,?,?,?,?,?,?);"
  console.log(sql_query);
  connection.query(sql_query, [request.body.id, request.body.productName, request.body.productPrice, request.body.productType, request.body.productColor, request.body.productDisc, request.body.productURL], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  })
})

app.post("/Cart", (request, response) => {
  const sql_query = "INSERT INTO cart VALUES (?,?,?,?)"
  console.log(sql_query);
  connection.query(sql_query, [request.body.productID, request.body.productQuantity, request.body.productSize, request.body.userID], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  })
})

app.post("/Carts", (request, response) => {

  const sqlQuery = `SELECT * FROM cart WHERE userID = ${request.body[0].userID}`;
  connection.query(sqlQuery, (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      function removeDuplicates(arr1, arr2) {
        const uniqueIds = new Set(arr2.map((item) => item.productID));
        return arr1.filter((item) => !uniqueIds.has(item.productID));
      }

      // Remove objects with matching IDs from array1
      const uniqueArray = removeDuplicates(request.body, result);
      console.log(uniqueArray);
      let data = "";
      for (let i = 0; i < uniqueArray.length; i++) {
        data = data + "(" + uniqueArray[i].productID + "," + uniqueArray[i].productQuantity + "," + uniqueArray[i].productSize + "," + uniqueArray[i].userID + ")";
        if (i != uniqueArray.length - 1) {
          data = data + ",";
        }
      }
      const sql_query = "INSERT INTO cart VALUES " + data;
      console.log(sql_query);
      connection.query(sql_query, (error, result) => {
        if (error) {
          response.status(500).send(error);
        }
        else {
          response.status(200).send(result);
        }
      })
    }
  })
})

app.delete("/Cart/:pid/:uid", (request, response) => {
  const productID = request.params.pid;
  const userID = request.params.uid;
  const sql_query = "DELETE FROM cart WHERE productID = ? AND userID = ?"
  console.log(sql_query + productID + userID);
  connection.query(sql_query, [productID, userID], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  })
})

app.get("/Cart/:id", (request, response) => {
  const userID = request.params.id;
  const sql_query = "SELECT * FROM cart INNER JOIN products WHERE cart.productID = products.id AND userID = ?;"
  console.log(sql_query);
  connection.query(sql_query, [userID], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.post("/users", (request, response) => {
  const sql_query = "INSERT INTO users VALUES (?,?,?,?);"
  console.log(sql_query);
  connection.query(sql_query, [request.body.userID, request.body.email, request.body.name, request.body.password], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.put("/addtrendingProducts/:id", (request, response) => {
  const pid = request.params.id;
  const sql_query = `UPDATE products SET trending = TRUE WHERE id = ${pid};`;
  console.log(sql_query);
  connection.query(sql_query, [pid], (error, result) => {
    if(error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.put("/removetrendingProducts/:id", (request, response) => {
  const pid = request.params.id;
  const sql_query = `UPDATE products SET trending = FALSE WHERE id = ${pid};`;
  console.log(sql_query);
  connection.query(sql_query, [pid], (error, result) => {
    if(error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});


app.get("/users/:email/:password", (request, response) => {
  const email = request.params.email;
  const password = request.params.password;
  const sql_query = "SELECT * FROM users WHERE email = ? AND password = ?";

  connection.query(sql_query, [email, password], (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.get("/products/productType/:ptype", (request, response) => {
  const productType = request.params.ptype;
  const sql_query = "SELECT * FROM products WHERE productType = ?";
  connection.query(sql_query, [productType], (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.get("/search/:query", (request, response) => {
  const queryy = request.params.query;
  const sql = `SELECT * FROM products WHERE LOWER(REGEXP_REPLACE(productName, '[^a-zA-Z0-9]', '')) LIKE ? OR LOWER(REGEXP_REPLACE(productType, '[^a-zA-Z0-9]', '')) LIKE ? OR LOWER(REGEXP_REPLACE(productColor, '[^a-zA-Z0-9]', '')) LIKE ?`;
  const params = [`%${queryy}%`, `${queryy}`, `%${queryy}%`];
  // const sql_query = `SELECT * FROM products WHERE LOWER(REGEXP_REPLACE(productName, '[^a-zA-Z0-9]', '')) LIKE '%${queryy}%'`
  connection.query(sql, params, (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.get("/seller/:email/:password", (request, response) => {
  const email = request.params.email;
  const password = request.params.password;
  const sql_query = "SELECT * FROM seller WHERE email = ? AND password = ?";

  connection.query(sql_query, [email, password], (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.get("/products/:id", (request, response) => {
  const productId = request.params.id;
  const sql_query = "SELECT * FROM products WHERE id = ?";

  connection.query(sql_query, [productId], (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.get("/persons", (request, response) => {
  const sql_query = "SELECT * from person";
  connection.query(sql_query, (error, result) => {
    if(error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});


app.put("/products/:id", (request, response) => {
  const sql_query = "UPDATE products SET productName = ?,productPrice = ?,productType = ?,productColor = ?,productDisc = ?,productURL = ? WHERE id = ?;"
  console.log(sql_query);
  connection.query(sql_query, [request.body.productName, request.body.productPrice, request.body.productType, request.body.productColor, request.body.productDisc, request.body.productURL, request.body.id], (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.delete("/products/:id", (request, response) => {
  const productId = request.params.id;
  const sql_query = "DELETE FROM products WHERE id = ?";

  connection.query(sql_query, [productId], (error, result) => {
    if (error) {
      response.status(500).send(error);
    } else {
      response.status(200).send(result);
    }
  });
});

app.get("/", (request, response) => {
  response.send("<h1>Angular Server is running perfectly..</h1>")
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log("Node js server is running");
});