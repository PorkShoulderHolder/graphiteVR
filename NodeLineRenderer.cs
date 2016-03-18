using UnityEngine;
using System.Collections;

public class NodeLineRenderer : MonoBehaviour {
	public Transform[] nodes;


	// Use this for initialization
	void Start () {		
		LineRenderer l = this.GetComponent<LineRenderer> ();
		l.SetVertexCount (nodes.Length);
	}
	
	// Update is called once per frame
	void Update () {
		LineRenderer l = this.GetComponent<LineRenderer> ();
		for (int i = 0; i < nodes.Length; i++) {
			l.SetPosition (i, nodes [i].position);
		}
	}

	public void setColor (Color c) {
		LineRenderer l = this.GetComponent<LineRenderer> ();
		l.material.color = c;
	}
}
