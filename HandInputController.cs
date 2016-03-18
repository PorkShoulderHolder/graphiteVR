using UnityEngine;
using System.Collections;

public class HandInputController : MonoBehaviour {
	public Transform hand;
	public Transform thumb;
	public Transform index;
	public Transform middle;
	public Transform ring;
	public Transform pinky;

	public NodeLineRenderer[] line_sets;

	private const float OPEN_ANGLE = 60;

	public enum HandStatus {
		NULL = 0,
		ONE_FINGER = 1,
		TWO_FINGER = 2,
		FOUR_FINGER = 4,
		OPEN = 5,
		CLOSED = 6,
	}

	// Use this for initialization
	void Start () {
	
	}

	float getFingerAngle(Transform finger) {
		return Vector3.Angle (hand.forward, finger.forward);
	}

	// Update is called once per frame
	void Update () {
		HandStatus status = HandStatus.NULL;
		float thumb_angle = getFingerAngle (thumb);
		float index_angle = getFingerAngle (index);
		float middle_angle = getFingerAngle (middle);
		float ring_angle = getFingerAngle (ring);
		float pinky_angle = getFingerAngle (pinky);

		bool thumb_open = (thumb_angle < OPEN_ANGLE);
		bool index_open = (index_angle < OPEN_ANGLE);
		bool middle_open = (middle_angle < OPEN_ANGLE);
		bool ring_open = (ring_angle < OPEN_ANGLE);
		bool pinky_open = (pinky_angle < OPEN_ANGLE);
		//Debug.Log (string.Format("{0}, {1}, {2}, {3}", index_angle, middle_angle, ring_angle, pinky_angle));

		if (index_open && !middle_open && !ring_open && !pinky_open)
			status = HandStatus.ONE_FINGER;
		if (index_open && middle_open && !ring_open && !pinky_open)
			status = HandStatus.TWO_FINGER;
		if (index_open && middle_open && ring_open && pinky_open)
			status = HandStatus.FOUR_FINGER;
		//if (index_open && middle_open && ring_open && pinky_open)
		//	status = HandStatus.OPEN;
		if (!index_open && !middle_open && !ring_open && !pinky_open)
			status = HandStatus.CLOSED;

		setLineSetsColor (status);
	}

	void setLineSetsColor(HandStatus status) {
		//Debug.Log (status);
		Color c = Color.white;
		switch (status) {
		case HandStatus.ONE_FINGER:
			c = Color.red;
			break;
		case HandStatus.TWO_FINGER:
			c = Color.blue;
			break;
		case HandStatus.FOUR_FINGER:
			c = Color.green;
			break;
		case HandStatus.OPEN:
			c = Color.yellow;
			break;
		case HandStatus.CLOSED:
			c = Color.magenta;
			break;
		default:
			c = Color.white;
			break;
		}
		foreach (NodeLineRenderer line_set in line_sets) {
			line_set.setColor (c);
		}
	}
}
