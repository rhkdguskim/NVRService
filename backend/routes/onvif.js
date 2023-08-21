var express = require("express");
const router = express.Router();

var onvif = require('onvif');
var xml2js = require('xml2js')
var stripPrefix = require('xml2js').processors.stripPrefix;

var os = require('os');
const url = require('url');

let SearchCamlist = new Map();

onvif.Discovery.on('error', function(err,xml) {
	// The ONVIF library had problems parsing some XML
	console.log('Discovery error ' + err);
});

var networklist = [];
var interfaces = os.networkInterfaces();

for(eth in interfaces)
{
    networklist.push({name:eth});
}

var options = {device : networklist[0].name};
onvif.Discovery.probe(options);

onvif.Discovery.on('device', function(cam, rinfo, xml) {
    // Function will be called as soon as the NVT responses
    // Parsing of Discovery responses taken from my ONVIF-Audit project, part of the 2018 ONVIF Open Source Challenge
    // Filter out xml name spaces
    xml = xml.replace(/xmlns([^=]*?)=(".*?")/g, '');

    let parser = new xml2js.Parser({
        attrkey: 'attr',
        charkey: 'payload',                // this ensures the payload is called .payload regardless of whether the XML Tags have Attributes or not
        explicitCharkey: true,
        tagNameProcessors: [stripPrefix]   // strip namespace eg tt:Data -> Data
    });
    parser.parseString(xml,
        function(err, result) {
            if (err) {return;}
            let urn = result['Envelope']['Body'][0]['ProbeMatches'][0]['ProbeMatch'][0]['EndpointReference'][0]['Address'][0].payload;
            let xaddrs = result['Envelope']['Body'][0]['ProbeMatches'][0]['ProbeMatch'][0]['XAddrs'][0].payload;
            let scopes = result['Envelope']['Body'][0]['ProbeMatches'][0]['ProbeMatch'][0]['Scopes'][0].payload;
            scopes = scopes.split(" ");

            let hardware = "";
            let name = "";
            for (let i = 0; i < scopes.length; i++) {
                if (scopes[i].includes('onvif://www.onvif.org/name')) {name = decodeURI(scopes[i].substring(27));}
                if (scopes[i].includes('onvif://www.onvif.org/hardware')) {hardware = decodeURI(scopes[i].substring(31));}
            }
            //console.log(rinfo);
            let msg = 'Discovery Reply from ' + rinfo.address + ' (' + name + ') (' + hardware + ') (' + xaddrs + ') (' + urn + ')';
            //console.log(msg)
            const myUrl = new URL(xaddrs);
            //console.log(SearchCamlist);
            SearchCamlist.set(rinfo.address+":"+(myUrl.port||80), {"id":rinfo.address+":"+(myUrl.port||80),"address":rinfo.address,"port":myUrl.port || 80, "name":name, "hardware":hardware});
        }
    );
})

router.get("/", (req, res) => {    
    const myArray = Array.from(SearchCamlist.values()); // Map 객체의 값들만 가져와서 배열로 변환
    const json = JSON.stringify(myArray);
    //console.log(json);
    console.log(json)
    res.send(json);
 })

 router.get("/user", (req, res) => {
    res.send({onvifid:req.session.onvifid, onvifpwd:req.session.onvifpwd});
 })

 router.get("/networklist", (req, res) => {
    networklist = [];
    interfaces = os.networkInterfaces();
    for(eth in interfaces)
    {
        networklist.push({name:eth});
    }
    res.send(networklist);
 })

 router.post("/", (req, res) => {
    //console.log(req.body);
    var options = {device : req.body.eth, timeout : req.body.timeout};
    onvif.Discovery.probe(options);
    const myArray = Array.from(SearchCamlist.values()); // Map 객체의 값들만 가져와서 배열로 변환
    const json = JSON.stringify(myArray);
    //console.log(json);
    res.send(json);
 })

module.exports = router;