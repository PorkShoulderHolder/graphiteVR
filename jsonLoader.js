//import SimpleJSON;


import System.Collections.Generic; 
import System.IO;

@script RequireComponent(MeshFilter);
@script RequireComponent(MeshRenderer);

static var kdtree : KDTree;
static var uniquePoints : Vector3[]; 
static var colorList : Color[]; 
static var ptColorList : Color[];

static var idList : String[];

static var positionLookup = new Hashtable();
static var colorLookup = new Hashtable();
static var neighborLookup = new Hashtable();
static var selectedIndices : List.<int>;
static var indexLookup = new Hashtable();
static var indicesMaster : int[];
static var www:WWW;
public var opacity = 0.006;
static var scaling = 500.0;
static var loaded = false;
static var meshesLoaded = false;

static var ns = 0;
static var es = 0;
static var nodesComplete = 0;
static var edgesComplete = 0 ;
static var dld = false;
var content = new Hashtable();

public var url: String = "localhost:9000/api/list";


function loadFromServer(){
		Debug.Log("started");
		www = new WWW(url);
		yield;
	
}

function Start() {
	Debug.Log("started");
		dld = true;
	loadFromServer();
	//InvokeRepeating("testUpdate", 0, 0.05);
} 

function checkFinished(){
	return (ns - 1) == nodesComplete && ((2 * es) - 1) == edgesComplete && nodesComplete > 0 && edgesComplete > 0;
}

function Update () {

	if(!loaded && !dld){
		loadFromServer();
	}
	if(www.isDone && !checkFinished() && !loaded){
		Debug.Log("completed dl: " + www.error);
		JSONUtils.ParseJSON(www.text, function(output:Hashtable){
			content = output;
			Debug.Log("completed parseing: " + www.error);
			loaded = true;
		}, function(progress:int){
			Debug.Log("json decoding: " + progress);
		});
	}
	else if (www.isDone && !checkFinished()){
		processData(content);

	}
	else if(www.isDone && checkFinished()){
		UpdateMeshes();
	}
			Debug.Log(nodesComplete + ", " + edgesComplete + "} " + ns);

}


function processData(content : Hashtable){
	if(nodesComplete  == 0){
		processNodes(content["nodes"]);
		Debug.Log("done w/ nodes");
    	Debug.Log("node count: " + uniquePoints.length);
    	Debug.Log(ns + "node count: " + nodesComplete);
    }
    if(nodesComplete == (ns - 1) && edgesComplete == 0){
		processEdges(content["edges"]);	
		Debug.Log("done w/ edges");
   		Debug.Log("edge count * 2: " + indicesMaster.length);
    }
}

function createMeshObject(name:String, points:Vector3[], colors:Color[], indices:int[], topoType:int){
	
	var meshObject:GameObject = new GameObject(name);
	var material = new Material(Shader.Find ("Mobile/Particles/Additive"));

	if( name == "Nodes" ){
		material = new Material(Shader.Find ("Mobile/Particles/Alpha Blended"));
	}
	var mesh: Mesh = new Mesh();

	meshObject.transform.parent = this.transform;
	meshObject.AddComponent(MeshRenderer);
	meshObject.GetComponent.<MeshRenderer>().material = material;

	meshObject.AddComponent(MeshFilter);
	meshObject.GetComponent.<MeshFilter>().mesh = mesh;

	meshObject.transform.localScale = new Vector3(1,1,1);
	meshObject.transform.localPosition = new Vector3(0,0,0);

	mesh.vertices = points;
	mesh.colors = colors;
	mesh.SetIndices(indices, topoType, 0);
}

function UpdateMeshes() {
	var identityList:int[] = new int[uniquePoints.length];

    for(var i = 0; i < uniquePoints.length; i++){
    	identityList[i] = i;
    }

	createMeshObject("Edges", uniquePoints, colorList, indicesMaster, MeshTopology.Lines);
	createMeshObject("Nodes", uniquePoints, ptColorList, identityList, MeshTopology.Points);
//	var pointsMesh: Mesh;
//
//	var 
//	mesh = new Mesh();
//	pointsMesh = new Mesh();
//
//
//	Debug.Log(GetComponent);
//	gameObject.AddComponent(MeshFilter);
//	this.GetComponent.<MeshFilter>().mesh = mesh;
//	this.GetComponent.<MeshFilter>().mesh = pointsMesh;
//	pointsMesh.vertices = uniquePoints;
//	pointsMesh.colors = ptColorList;
//	pointsMesh.SetIndices(identityList, MeshTopology.Points,0);
//	mesh.vertices = uniquePoints;
//	mesh.colors = colorList;
//	mesh.SetIndices(indicesMaster, MeshTopology.Lines,0);
}

function processNodes(nodes : Array) {
    var nodeLookup = new Hashtable();
    var ind = 0;

    // set global vars

    uniquePoints = new Vector3[nodes.length];
    idList = new String[nodes.length];
    colorList = new Color[nodes.length];
    ptColorList = new Color[nodes.length];

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
    	var cpt:Color;

    	c = new Color(r/div, g/div, b/div, opacity);
    	cpt = new Color(r/div, g/div, b/div, 1);


    	colorLookup[id] = c;
    	colorList[ind] = c;
		nodesComplete = ind;

    	ptColorList[ind] = cpt;
    	if( ind % 1000 == 0 ) {
    		yield;
    	}
    	ind ++;
    }
    ns = nodes.length;
    kdtree = KDTree.MakeFromPoints(uniquePoints);
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

function processEdges(edges : Array){   
    indicesMaster = new int[2 * edges.length]; 
	var i = 0;
	var g = 0;
    for(var edge:Hashtable in edges){        
    	var source = edge["source"].ToString();
    	var target = edge["target"].ToString();
    	//addNeighbor(neighborLookup, source, target, i);
    	//addNeighbor(neighborLookup, target, source, i + 1);
    	indicesMaster[i] = indexLookup[source];
    	indicesMaster[i+1] = indexLookup[target];
    	i += 2;
		edgesComplete = i;
    	if( i % 1000 == 0 ) {
    		yield;
    	}
    }
    es = 2 * edges.length;
 }
