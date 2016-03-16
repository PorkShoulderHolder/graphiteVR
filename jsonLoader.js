//import SimpleJSON;


import System.Collections.Generic; 
import System.IO;

@script RequireComponent(MeshFilter);
@script RequireComponent(MeshRenderer);

static var kdtree : KDTree;
static var uniquePoints : Vector3[] =  new Vector3[12835];
static var idList : String[] =  new String[12835];

static var mesh: Mesh;
static var positionLookup = new Hashtable();
static var colorLookup = new Hashtable();
static var neighborLookup = new Hashtable();
static var selectedIndices : List.<int>;
static var opacity = 0.1;
static var scaling = 500.0;
var numPoints: int = 60000;
var start = 0;
var pts: Vector3[] = new Vector3[47486];
var clrs: Color[] = new Color[47486];
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

function CreateMesh() {
	ParseGexf();
	var points: Vector3[] = pts;
	var numPoints = points.Length;
	var indices: int[] = new int[numPoints];
	var colors : Color[] = clrs;
	for(var i: int=0;i<points.Length;++i) {
		//points[i] = new Vector3(Random.value * 200, Random.value * 100, Random.value * 100);
		indices[i] = i;
		//colors[i] = new Color(0,1,0,0.07);
	};
	mesh.vertices = points;
	mesh.colors = colors;
	mesh.SetIndices(indices, MeshTopology.Lines,0);
	
}


// Update is called once per frame

function ReadFileLUT(nodes : Array) {
    var nodeLookup = new Hashtable();
    var ind = 0;
    Debug.Log(nodes);
    for(var ht:Hashtable in nodes){      
    	var id = ht["id"].ToString();

    	ind ++;
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

    	        	
    	var r =  rgb[0];
    	var g =  rgb[1];
    	var b =  rgb[2];
    	colorLookup[id] = new Color(r,g,b,opacity);
    }
    Debug.Log(ind);
    kdtree = KDTree.MakeFromPoints(uniquePoints);
	Debug.Log(kdtree);
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

function ReadFileEdges(edges : Array){   
    var tempPoints = new Array();
    var tempColors = new Array();
	var i = 0;
    for(var edge:Hashtable in edges){        
        var source =  edge["source"].ToString();
        var target =  edge["target"].ToString();
 		tempColors.push(colorLookup[source]);
        tempColors.push(colorLookup[target]);
        tempPoints.push(positionLookup[source]);
        tempPoints.push(positionLookup[target]);
        addNeighbor(neighborLookup, source, target, i);
        addNeighbor(neighborLookup, target, source, i + 1);
        i += 2;
    }

	i = 0;

    for(nodepos in tempPoints){
    	
    	pts[i] = nodepos;
    	i++;
    }

    i = 0;
    for(c in tempColors){
    	clrs[i] = c;
    	i++;
    }

}

function ParseGexf(){
	var www = new WWW(url);
	yield www;
	content = JSONUtils.ParseJSON(www.text);
	positionLookup = ReadFileLUT(content["nodes"]);
	ReadFileEdges(content["edges"]);
}
