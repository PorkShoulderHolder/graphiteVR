
public var url:String = "localhost:9000/api/list";

// Use this for initialization
function Start () {
	var www = new WWW(url);
	yield www;
	Debug.Log(www.error);
	var s = www.text.Remove(0,1).Remove(www.text.length-2,1).Split(","[0]);
	var i:float = 0;
	for(name in s){
		var clean:Array = name.Split("_"[0]);
		clean[clean.length-1] = "";
		var cleaned:String = clean.join(" ").Remove(0,1);
		var textObject:GameObject = new GameObject("textbox");
		textObject.AddComponent(TextMesh);
		textObject.GetComponent(TextMesh).text = cleaned;
		textObject.transform.position.y = 0.2 * i;
		textObject.transform.localScale = new Vector3(0.05,0.05,0.05);
		i += 1;
	}
}

// Update is called once per frame
function Update () {
}

