import express, {urlencoded, json} from "express";
import cors from "cors";
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand} from "@aws-sdk/lib-dynamodb";
import randomString from "randomstring";

const app=express();
const port= 3000;
const client = new DynamoDBClient({ region: "us-east-1" });
const table_name = "tabla-bruno"

app.use(cors());

app.use(urlencoded({ extended: false }))
     
app.use(json())

app.post('/api/add-data', async (req, res) => {
    const { full_name, age, team, worldcups } = req.body;
    const docClient = DynamoDBDocumentClient.from(client);
    const params = {
        TableName: table_name,
        Item: {
        key: randomString.generate(10),
        full_name: full_name,
        age: age,
        team: team,
        worldcups: worldcups
        },
    };
    try {
        await docClient.send(new PutCommand(params));
        console.log("Item added successfully");
    } catch (err) {
        console.error(err);
    }
  
    return res.status(200).json('Registro agregado!');
});

app.use('/api/get-data', async (req, res) => {
    //const { email, password } = req.body;
    // will hold all rows
    let allPosts = []

    // will hold LastEvaluatedKey attribute
    let lastEvaluatedKey

    // keep requesting new data until break
    while (true) {
    const params = {
        TableName: table_name,
        ProjectionExpression: 'full_name,age,team,worldcups'
    }

    if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey
    }

    const data = await client.send(new ScanCommand(params))

    const reqPosts = []
    data.Items.forEach(post => {
        reqPosts.push(post)
    })
    allPosts = allPosts.concat(reqPosts)

    // if LastEvaluatedKey attribute present & not-null
    // then additional rows are remaining
    if ('LastEvaluatedKey' in data && data.LastEvaluatedKey) {
        lastEvaluatedKey = data.LastEvaluatedKey
    } else {
        break
    }
    }
    return res.status(200).json(allPosts);  
});

app.listen(port, ()=>{
    console.log('Express server started at Port ', port)
})