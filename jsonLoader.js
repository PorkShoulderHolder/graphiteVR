//import SimpleJSON;


import System.Collections.Generic; 
import System.IO;

@script RequireComponent(MeshFilter);
@script RequireComponent(MeshRenderer);

static var kdtree : KDTree;
static var uniquePoints : Vector3[]; 
static var colorList : Color[]; 

static var idList : String[];

static var mesh: Mesh;
static var positionLookup = new Hashtable();
static var colorLookup = new Hashtable();
static var neighborLookup = new Hashtable();
static var selectedIndices : List.<int>;
static var indexLookup = new Hashtable();
static var indicesMaster : int[];

public var opacity = 0.1;
static var scaling = 500.0;

var content = new Hashtable();

public var url: String = "localhost:9000/api/list";


function Start() {
	mesh = new Mesh();
	GetComponent.<MeshFilter>().mesh = mesh;
	CreateMesh();
	
	//InvokeRepeating("testUpdate", 0, 0.05);
} 

function Update () {
	
}

function ColorMap(index){
	
}

function CreateMesh() {
	var www = new WWW(url);
	yield www;
	Debug.Log(www.error);
	content = JSONUtils.ParseJSON(www.text);

	positionLookup = processNodes(content["nodes"]);
	Debug.Log("done w/ nodes");
	indicesMaster = processEdges(content["edges"], indicesMaster);
	Debug.Log("done w/ edges");

	mesh.vertices = uniquePoints;
	mesh.colors = colorList;
	mesh.SetIndices(indicesMaster, MeshTopology.Lines,0);
}


function processNodes(nodes : Array) {
    var nodeLookup = new Hashtable();
    var ind = 0;

    // set global vars

    uniquePoints = new Vector3[nodes.length];
    idList = new String[nodes.length];
    colorList = new Color[nodes.length];

    for(var ht:Hashtable in nodes){      
    	var id = ht["id"].ToString();

    	var poslist:Array = ht["positions"]; 
    	var pos:Array = poslist[0];
    	var rgblist:Array = ht["colors"];
    	var rgb:Array = rgblist[0];

    	var x =  parseFloat(pos[0].ToString());
    	var y =  parseFloat(pos[1].ToString());
    	var z =  parseFloat(pos[2].ToString());

    	nodeLookup[id] = new Vector3(x,y,z);
    	uniquePoints[ind] = nodeLookup[id];
    	idList[ind] = id;
    	indexLookup[id] = ind;
   	
    	var r:double =  rgb[0];
    	var g:double =  rgb[1];
    	var b:double =  rgb[2];
    	var div:double = 256.00000;
    	var c:Color;
    	c = new Color(r/div, g/div, b/div, opacity);
    	colorLookup[id] = c;
    	colorList[ind] = c;
    	ind ++;
    }
    kdtree = KDTree.MakeFromPoints(uniquePoints);
    return nodeLookup;
}

function addNeighbor(lookup : Hashtable, source : String, target : String, index : int){
	if(lookup[source]){
		var h : Hashtable = lookup[source];
		var a : List.<String> = h["indices"];
		var b : List.<String> = h["neighbors"];
		
		a.Add(index.ToString());
		b.Add(target);
	}
	else{
		lookup[source] = new Hashtable();
		var localHash : Hashtable = lookup[source];
		var aNew : List.<String> = new List.<String>();
		var bNew : List.<String> = new List.<String>();
		aNew.Add(index.ToString());
		bNew.Add(target);
		localHash["indices"] = aNew;
		localHash["neighbors"] = bNew;
	}	
}

function processEdges(edges : Array, indices : int[]){   
    indices = new int[2 * edges.length]; 
	var i = 0;

    for(var edge:Hashtable in edges){        
        var source = edge["source"].ToString();
        var target = edge["target"].ToString();
        addNeighbor(neighborLookup, source, target, i);
        addNeighbor(neighborLookup, target, source, i + 1);
        indices[i] = indexLookup[source];
        indices[i+1] = indexLookup[target];
        i += 2;
    }
    return indices;
}
