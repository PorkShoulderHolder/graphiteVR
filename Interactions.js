#pragma strict
var z = 50.0;

static var sphere : GameObject;
static var selected : GameObject;
var finger : GameObject;
var offset : Vector3;
function Start () {
	sphere = GameObject.Find("Sphere");
	selected = GameObject.Find("Center");
}


function Update() {
//		var finger = GameObject.Find("CleanRobotRightHand(Clone)/index/bone3");
//		
//		if(finger){
//		var p : Vector3 = new Vector3(finger.transform.position.x + offset.x, finger.transform.position.y + offset.y, finger.transform.position.z + offset.z);
//		
//			var index = PointCloud.kdtree.FindNearest(p);
//			var id = PointCloud.idList[index];
//			var info = PointCloud.neighborLookup[id];
//			PointCloud.Highlight(info["indices"]);
//		}
}