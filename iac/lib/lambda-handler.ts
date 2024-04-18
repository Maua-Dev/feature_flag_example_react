import * as http from "http";

export const handler = async () => {
  
  const flag : unknown = await getFlag("btn");
  
  const parsedFlag = JSON.parse(flag as string);
  
  const response = {
    statusCode: 200,
    body: parsedFlag.enabled,
  };
  return response;
};

async function getFlag(flagName : string) {
    const appconfigPort = 2772;

    const url = `http://localhost:${appconfigPort}`
        + `/applications/${process.env.APPCONFIG_APPLICATION}`
        + `/environments/${process.env.APPCONFIG_ENVIRONMENT}`
        + `/configurations/${process.env.APPCONFIG_CONFIGURATION}`
        + `?flag=${flagName}`;

    return await getAppConfig(url);
}

async function getAppConfig(url : string) {

    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            if (res.statusCode! < 200 || res.statusCode! >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            const body : [] = [];
            res.on('data', function(chunk) {
                body.push(chunk as never);
            });
            res.on('end', function() {
                resolve(Buffer.concat(body).toString());
            });
        });
        req.on('error', (e)=> {
            reject(e.message);
        });
        req.end();
    });
}