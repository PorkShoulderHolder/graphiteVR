//import UnityEngine;
#pragma strict


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
var numPoints: int = 60000;
var start = 0;
// Use this for initialization
function Start() {
	mesh = new Mesh();
	GetComponent.<MeshFilter>().mesh = mesh;
	CreateMesh();
	
	//InvokeRepeating("testUpdate", 0, 0.05);
}   

function CreateMesh() {
	var ptsClrs = ParseGexf();
	var points: Vector3[] = ptsClrs[0];
	var numPoints = points.Length;
	var indices: int[] = new int[numPoints];
	var colors : Color[] = ptsClrs[1];
	for(var i: int=0;i<points.Length;++i) {
		//points[i] = new Vector3(Random.value * 200, Random.value * 100, Random.value * 100);
		indices[i] = i;
		//colors[i] = new Color(0,1,0,0.07);
	};
	mesh.vertices = points;
	mesh.colors = colors;
	mesh.SetIndices(indices, MeshTopology.Lines,0);
	
}

static function Highlight(indices){
	var colors: Color[] = mesh.colors;
	for(i in selectedIndices){
		colors[i] = new Color(colors[i][0],colors[i][1],colors[i][2],opacity);
	}
	for(j in indices){
		colors[j] = new Color(colors[j][0],colors[j][1],colors[j][2],1);;
	}
	
	mesh.colors = colors;
	selectedIndices = indices;
}

function Update(){
//	var p : Vector3 = camera.ScreenToWorldPoint (Vector3 (Input.mousePosition.x, Input.mousePosition.y,camera.nearClipPlane));
//	Debug.Log(p);
//	var range = 100;
//	var r = new Color(1.0,0.0,0.0,1.0);
//
//	
//	for(var i: int=start; i<colors.Length && i < start + range; ++i){
//		colors[i] = new Color(colors[i][0],colors[i][1],colors[i][2],opacity);
//	}
//	start = Random.value * colors.Length;
//
//	for(var j: int=start; j<colors.Length && j < start + range; ++j){
//		colors[j] = new Color(colors[i][0],colors[i][1],colors[i][2],1);;
//	}
//	mesh.colors = colors;
	//Debug.Log(kdtree);
}

function ReadFileLUT(filepathIncludingFileName : String) {

    var txt : TextAsset = Resources.Load("Untitled", typeof(TextAsset));
    var fileContents = txt.text;
    var nodeLookup = new Hashtable();
    
    var id = "sent";
    var ind = 0;
    
    for(line in fileContents.Split("\n"[0])){
      
        if(line.IndexOf("label") != -1){
        	id = line.Split('"'[0])[3];
        }
        if(line.IndexOf("viz:position") != -1){
        	ind ++;
        	var x =  parseFloat(line.Split('"'[0])[1]) / 500.0;
        	var y =  parseFloat(line.Split('"'[0])[3]) / 500.0;
        	var z =  parseFloat(line.Split('"'[0])[5]) / 500.0;
        	nodeLookup[id] = new Vector3(x,y,z);
        	uniquePoints[ind] = nodeLookup[id];
        	idList[ind] = id;
        }
        if(line.IndexOf("viz:color") != -1){
        	
        	var r =  parseFloat(line.Split('"'[0])[1]) / 256.0;
        	var g =  parseFloat(line.Split('"'[0])[3]) / 256.0;
        	var b =  parseFloat(line.Split('"'[0])[5]) / 256.0;
        	colorLookup[id] = new Color(r,g,b,opacity);
        	
        }
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

function ReadFileEdges(filepathIncludingFileName : String){
	var txt : TextAsset = Resources.Load("Untitled", typeof(TextAsset));
    var fileContents = txt.text;
    var nodeLookup = new Array();
    var id = "sent";
    var lines = fileContents.Split("\n"[0]);
    var tempPoints = new Array();
    var tempColors = new Array();
	var i = 0;
	
    for(line in lines){
      	//Debug.Log(line);
        if(line.IndexOf("source=") != -1){
        	var source =  line.Split('"'[0])[1];
        	var target =  line.Split('"'[0])[3];
 			tempColors.push(colorLookup[source]);
        	tempColors.push(colorLookup[target]);
        	tempPoints.push(positionLookup[source]);
        	tempPoints.push(positionLookup[target]);
        	addNeighbor(neighborLookup, source, target, i);
        	addNeighbor(neighborLookup, target, source, i + 1);
        	
        	i += 2;
        }
    }
    var pts: Vector3[] = new Vector3[47486];
    var clrs: Color[] = new Color[47486];

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
    return [pts,clrs];
}

function ParseGexf(){
	positionLookup = ReadFileLUT("Untitled/coords.gexf");
	return ReadFileEdges("Untitled/coords.gexf");
}
