#pragma strict
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

static var selectedIndex:int = -1;
static var savedColor = new Color(0,0,0,0);
static var highlightColor = new Color(1,1,1,0.1);

public var finger:Transform;
public var tooltip:GameObject;
public var HIC1:HandInputController;

var highLighted = false;

var fps = 0;
var frames = 0;
static var opacity:float = 0.05f;
static var scaling = 500.0;
static var cccc = 0;
static var nodesMesh:Mesh;
static var edgesMesh:Mesh;
public var offset = -7.22;
public var sphere : GameObject;

var content = new Hashtable();
var handStatus:int;

public var url: String = "localhost:9000/api/list";


function Start() {
	sphere = GameObject.Find("Sphere");

	var www = new WWW(url);
	yield www;
	Debug.Log(www.error);

	content = JSONUtils.ParseJSON(www.text);
	processData(content);
	UpdateMeshes();

} 

function Update () {

	fps += 1.0 / Time.deltaTime;
	frames++;
	if(frames%600 ==0){
		Debug.Log("AVG FPS: " +  fps / frames);
	}
}
function testUpdate(){
	
}

function ColorMap(index){
	
}

public static function unHighlight(index){
	var nodesChild:GameObject = GameObject.Find("Network/Nodes");
	var edgesChild:GameObject = GameObject.Find("Network/Edges");
	 
	var nodesMesh:Mesh = nodesChild.GetComponent.<MeshFilter>().mesh;
	var edgesMesh:Mesh = edgesChild.GetComponent.<MeshFilter>().mesh;

	if( selectedIndex >= 0 ){
		var nsColor = new Color(savedColor[0],savedColor[0],savedColor[0],1);
		var esColor = new Color(savedColor[0],savedColor[0],savedColor[0], opacity);
		nodesMesh.colors[selectedIndex] = nsColor;
		edgesMesh.colors[selectedIndex] = esColor;
	}
	selectedIndex = -1;
}

function highlight(){
	var p : Vector3 = new Vector3(finger.position.x , finger.position.y, finger.position.z);

	//var p = sphere.transform.position;
	offset = this.transform.position.y; 

	p -= this.transform.position;
	p /= this.transform.localScale.x;
	var index:int = kdtree.FindNearest(p);
	highlightIndex(index);
}

function highlightIndex(index:int){
	var edgesChild:GameObject = GameObject.Find("Edges");
	var cs:Color[] = colorList;
	var ptCs:Color[] = ptColorList;

	if( selectedIndex >= 0 ){
		var nsColor = new Color(savedColor[0],savedColor[1],savedColor[2],1);
		var esColor = new Color(savedColor[0],savedColor[1],savedColor[2], opacity);
		cs[selectedIndex] = esColor;
		ptCs[selectedIndex] = nsColor;
	}

	savedColor = cs[index];
	cs[index] = highlightColor;
	ptCs[index] = highlightColor;
	selectedIndex = index;

	nodesMesh.vertices = uniquePoints;
	edgesMesh.vertices = uniquePoints;

	nodesMesh.colors  = ptCs;
	edgesMesh.colors  = cs;

	var ht:Hashtable = positionLookup[index];
	var location:Vector3 = uniquePoints[index];

	location *= this.transform.localScale.x;
	location += this.transform.position;
	if(tooltip.GetComponent(TextMesh).text != ht["screen_name"]){

		tooltip.transform.position = location + new Vector3(0,0.03,0);	
		tooltip.GetComponent(TextMesh).text = ht["screen_name"];

//		var www: WWW = new WWW(ht["profile_image_url"]);
//		yield www;
//		if(!www.error){
//			Debug.Log(ht["profile_image_url"]);
//			www.LoadImageIntoTexture(imagePlane.GetComponent.<Renderer>().material.mainTexture);
//		}
//		else{
//			Debug.Log(www.error);
//		}
	}
	tooltip.transform.LookAt(2 * tooltip.transform.position - Camera.main.transform.position);

}


function processData(content : Hashtable){
	positionLookup = processNodes(content["nodes"]);
	Debug.Log("done w/ nodes");
    Debug.Log("node count: " + uniquePoints.length);

	indicesMaster = processEdges(content["edges"], indicesMaster);
	Debug.Log("done w/ edges");
    Debug.Log("edge count * 2: " + indicesMaster.length);
}

function createMeshObject(mesh:Mesh, name:String, points:Vector3[], colors:Color[], indices:int[], topoType:int){
	
	var meshObject:GameObject = new GameObject(name);
	var material = new Material(Shader.Find ("Mobile/Particles/Additive"));
	if( name == "Nodes" ){
		material = new Material(Shader.Find ("Mobile/Particles/Alpha Blended"));
	}

	meshObject.transform.parent = this.transform;
	meshObject.transform.localScale = new Vector3(1,1,1);
	meshObject.transform.localPosition = new Vector3(0,0,0);

	meshObject.AddComponent(MeshRenderer);
	meshObject.GetComponent.<MeshRenderer>().material = material;

	meshObject.AddComponent(MeshFilter);
	meshObject.GetComponent.<MeshFilter>().mesh = mesh;

	mesh.MarkDynamic();
	mesh.vertices = points;
	mesh.colors = colors;
	mesh.SetIndices(indices, topoType, 0);
}

function UpdateMeshes() {
	var identityList:int[] = new int[uniquePoints.length];

    for(var i = 0; i < uniquePoints.length; i++){
    	identityList[i] = i;
    }

   // nodesMesh = new Mesh();
    edgesMesh = new Mesh();
	createMeshObject(edgesMesh, "Edges", uniquePoints, colorList, indicesMaster, MeshTopology.Lines);
	//createMeshObject(nodesMesh, "Nodes", uniquePoints, ptColorList, identityList, MeshTopology.Points);
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

    	nodeLookup[ind] = ht;
    	uniquePoints[ind] = new Vector3(x,y,z);
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
    	ptColorList[ind] = cpt;

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
	var g = 0;
    for(var edge:Hashtable in edges){        
    	var source = edge["source"].ToString();
    	var target = edge["target"].ToString();
    	//addNeighbor(neighborLookup, source, target, i);
    	//addNeighbor(neighborLookup, target, source, i + 1);
    	indices[i] = indexLookup[source];
    	indices[i+1] = indexLookup[target];
    	i += 2;
    }
    return indices;
}
