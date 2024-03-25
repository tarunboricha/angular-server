import express from "express";
import mysql from "mysql";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import natural from "natural";
import { config } from 'dotenv'

config();
const app = express();
const server = http.createServer(app);
const tokenizer = new natural.WordTokenizer();

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


const dictionary = ['t-shirt'];
const queryProductTypes = "SELECT DISTINCT productType FROM products";
connection.query(queryProductTypes, (error, results) => {
  if (error) {
    console.error("Error fetching distinct product types:", error);
    return;
  }
  results.forEach((row) => {
    dictionary.push(row.productType);
  });

  const queryProductColors = "SELECT DISTINCT LOWER(REGEXP_REPLACE(productColor, '[^a-zA-Z0-9]', '')) AS productColor FROM products";
  connection.query(queryProductColors, (error, results) => {
    if (error) {
      console.error("Error fetching distinct product colors:", error);
      return;
    }
    results.forEach((row) => {
      dictionary.push(row.productColor);
    });

    const queryProductNames = `SELECT DISTINCT LOWER(REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(productName, ' ', numbers.n), ' ', -1), '[^a-zA-Z0-9]', '')) AS productName
    FROM products
    JOIN (
        SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        -- Add more numbers based on the maximum number of words in your product names
    ) numbers ON CHAR_LENGTH(productName) - CHAR_LENGTH(REPLACE(productName, ' ', '')) >= n - 1;`;
    connection.query(queryProductNames, (error, results) => {
      if (error) {
        console.error("Error fetching distinct product names:", error);
        return;
      }
      results.forEach((row) => {
        dictionary.push(row.productName);
      });

      console.log(dictionary);
      const spellchecker = new natural.Spellcheck(dictionary);

      app.get("/search", (request, response) => {
        const searchData = request.query.query.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
        const isCorrection = request.query.correction;
        console.log(isCorrection);
        const searchTerms = tokenizer.tokenize(searchData);
        let correctedQuery = '';
        let whereClause = '';

        searchTerms.forEach((term, index) => {
          if (isCorrection === "true") {
            const isCorrectlySpelled = spellchecker.isCorrect(term);
            if (!isCorrectlySpelled) {
              const suggestions = spellchecker.getCorrections(term, 2);
              term = suggestions.length > 0 ? suggestions[0] : term;
            }
          }

          correctedQuery += term;
          whereClause += `(productType LIKE '${term}' OR LOWER(REGEXP_REPLACE(productName, '[^a-zA-Z0-9 ]', '')) LIKE '%${term}%' OR LOWER(REGEXP_REPLACE(productColor, '[^a-zA-Z0-9 ]', '')) LIKE '%${term}%')`;

          if (index < searchTerms.length - 1) {
            correctedQuery += ' ';
            whereClause += ' AND ';
          }
        });

        const query = `SELECT * FROM products WHERE ${whereClause}`;
        console.log("Original Query:", searchData);
        console.log("Corrected Query:", correctedQuery);
        // console.log("SQL Query:", query);

        connection.query(query, (error, result) => {
          if (error) {
            response.status(500).send(error);
          } else {
            response.status(200).send({ correctedQuery, result: result });
          }
        });
      });
    });
  });
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

  connection.query(sql_query, [productType, pid], (error, result) => {
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
  const sql_query = "INSERT INTO products VALUES (0,?,?,?,?,?,?, 0, 3);"
  console.log(sql_query);
  connection.query(sql_query, [request.body.productName, request.body.productPrice, request.body.productType, request.body.productColor, request.body.productDisc, request.body.productURL], (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.post("/Cart", (request, response) => {
  const sql_query = "INSERT INTO cart (id, productID, productQuantity, productSize, userID, savelater) VALUES (0, ?,?,?,?, 0) ON DUPLICATE KEY UPDATE productID = VALUES(productID), productQuantity = VALUES(productQuantity), productSize = VALUES(productSize), userID = VALUES(userID), savelater = 0;"
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

  let data = '';
  for (let i = 0; i < request.body.length; i++) {
    data = data + `(0, ${request.body[i].productID}, ${request.body[i].productQuantity}, ${request.body[i].productSize}, ${request.body[i].userID}, ${request.body[i].savelater})`;
    if (i != request.body.length - 1) {
      data = data + ",";
    }
  }
  const sql_query = "INSERT INTO cart (id, productID, productQuantity, productSize, userID, savelater) VALUES " + data + "ON DUPLICATE KEY UPDATE id = VALUES(id), productID = VALUES(productID), productQuantity = VALUES(productQuantity), productSize = VALUES(productSize), userID = VALUES(userID), savelater =  VALUES(savelater);";
  console.log(sql_query);
  connection.query(sql_query, (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
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
  const sql_query = `INSERT INTO users VALUES (0,'${request.body.email}','${request.body.firstname}','${request.body.password}','${request.body.lastname}');`;
  console.log(sql_query);
  connection.query(sql_query, [,], (error, result) => {
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
    if (error) {
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
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.put("/cart/savelater", (request, response) => {
  const sql_query = `UPDATE cart SET savelater = TRUE WHERE userID = ${request.body.userID} AND productID = ${request.body.pID};`;
  console.log(sql_query);
  connection.query(sql_query, (error, result) => {
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});

app.put("/cart/movetocart", (request, response) => {
  const sql_query = `UPDATE cart SET savelater = FALSE WHERE userID = ${request.body.userID} AND productID = ${request.body.pID};`;
  console.log(sql_query);
  connection.query(sql_query, (error, result) => {
    if (error) {
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
    if (error) {
      response.status(500).send(error);
    }
    else {
      response.status(200).send(result);
    }
  });
});


app.put("/products/:id", (request, response) => {
  console.log(request.body);
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

const port = process.env.PORT;
server.listen(port, () => {
  console.log("Node js server is running");
});