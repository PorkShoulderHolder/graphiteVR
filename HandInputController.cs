using UnityEngine;
using System.Collections;
using System.Collections.Generic;


public class HandInputController : MonoBehaviour {
	public Transform hand;
	public Transform thumb;
	public Transform index;
	public Transform middle;
	public Transform ring;
	public Transform pinky;
	
	public GameObject network;
	public FingerRenderer[] line_sets;
	

	//TODO: use this for recognizing extended gestures
	private Queue<HandStatus> statusQueue = new Queue<HandStatus>(20);
	
	private const float OPEN_ANGLE = 60;

	public enum HandStatus {
		NULL = 0,
		ONE_FINGER = 1,
		TWO_FINGER = 2,
		FOUR_FINGER = 4,
		OPEN = 5,
		CLOSED = 6,
		ROCKIN = 7
	}
	private HandStatus handStatus = 0; 
	private HandStatus prevHandStatus = 0; 
	
	private Vector3 startPos;
	private Vector3 initialPosition;
	private Vector3 initialScale;
	private Vector3 positionVelocity;
	private Vector3 scaleVelocity;

	private Transform initialTransform;

	// Use this for initialization
	void Start () {
				positionVelocity = new Vector3 (0, 0, 0);
				scaleVelocity = new Vector3 (0, 0, 0);
	}

	float getFingerAngle(Transform finger) {
		return Vector3.Angle (hand.up, finger.up);
	}

	// Update is called once per frame
	void FixedUpdate () {
		prevHandStatus = handStatus;
		handStatus = getHandStatus();
		setLineSetsColor(handStatus);
		scaleNetwork ();
		moveNetwork ();
	}

	HandStatus getHandStatus(){
		HandStatus status = HandStatus.NULL;
		float thumb_angle = getFingerAngle (thumb);
		float index_angle = getFingerAngle (index);
		float middle_angle = getFingerAngle (middle);
		float ring_angle = getFingerAngle (ring);
		float pinky_angle = getFingerAngle (pinky);

		bool thumb_open = (thumb_angle < OPEN_ANGLE/2);
		bool index_open = (index_angle < OPEN_ANGLE);
		bool middle_open = (middle_angle < OPEN_ANGLE);
		bool ring_open = (ring_angle < OPEN_ANGLE);
		bool pinky_open = (pinky_angle < OPEN_ANGLE);
		//Debug.Log (string.Format("{0}, {1}, {2}, {3}", index_angle, middle_angle, ring_angle, pinky_angle));

		if (!thumb_open && index_open && !middle_open && !ring_open && !pinky_open)
				status = HandStatus.ONE_FINGER;
		if (!thumb_open && index_open && middle_open && !ring_open && !pinky_open)
				status = HandStatus.TWO_FINGER;
		if (!thumb_open && index_open && middle_open && ring_open && pinky_open)
				status = HandStatus.FOUR_FINGER;
		if (thumb_open && index_open && middle_open && ring_open && pinky_open)
				status = HandStatus.OPEN;
		if (!thumb_open && !index_open && !middle_open && !ring_open && !pinky_open)
				status = HandStatus.CLOSED;
		if (index_open && pinky_open && !middle_open && !ring_open && !thumb_open)
				status = HandStatus.ROCKIN;
		return status;
	}
	
	void testFingers(bool thumb_open, bool index_open, bool ring_open, bool middle_open, bool pinky_open){
		if (thumb_open) {
			line_sets [0].setColor (Color.green);
		} else {
			line_sets [0].setColor (Color.red);
		}
		if (index_open) {
			line_sets [1].setColor (Color.green);
		} else {
			line_sets [1].setColor (Color.red);
		}
		if (middle_open) {
			line_sets [2].setColor (Color.green);
		} else {
			line_sets [2].setColor (Color.red);
		}
		if (ring_open) {
			line_sets [3].setColor (Color.green);
		} else {
			line_sets [3].setColor (Color.red);
		}
		if (pinky_open) {
			line_sets [4].setColor (Color.green);
		} else {
			line_sets [4].setColor (Color.red);
		}
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
			case HandStatus.ROCKIN:
				c = new Color( Random.value, Random.value, Random.value, 1.0f );	
				break;
			default:
				c = Color.white;
				break;
		}
		foreach (FingerRenderer line_set in line_sets) {
			line_set.setColor (c);
		}
	}
	
	void scaleNetworkjj(){
		float delta = 0;
		if (prevHandStatus != handStatus && handStatus == HandStatus.ROCKIN) {
				startPos = hand.position;
				initialScale = network.transform.localScale;
		} else if (handStatus == HandStatus.ROCKIN) {
				delta = hand.position.y - startPos.y;
				Vector3 newScale = new Vector3(initialScale[0] + delta, initialScale[1] + delta, initialScale[2] + delta);
				if (newScale.x > 0.004) {
						network.transform.localScale = newScale;
				} else {
						network.transform.localScale = new Vector3 (0.004f, 0.004f, 0.004f);	
				}
		} 
	}

	void moveNetwork(){
			Vector3 delta = new Vector3(0,0,0);
			if (prevHandStatus != handStatus && handStatus == HandStatus.CLOSED) {
					startPos = hand.position;
					initialPosition = network.transform.position;
			} else if (handStatus == HandStatus.CLOSED) {
					delta = hand.position - startPos;
					network.transform.position = initialPosition + delta;
			} 
	}
	void scaleNetwork(){
			float delta = 0;
			Vector3 minScale = new Vector3 (0.004f, 0.004f, 0.004f);
			Vector3 objHandDelta = hand.position - network.transform.position;
			if (prevHandStatus != handStatus && handStatus == HandStatus.ROCKIN) {
					startPos = hand.position;
					initialPosition = network.transform.position;
					initialScale = network.transform.localScale;
			} else if (handStatus == HandStatus.ROCKIN) {
					delta = (hand.position.y - startPos.y);
					Vector3 newScale = initialScale + new Vector3 (delta, delta, delta); 
					Vector3 realScale = newScale.x >= minScale.x ? newScale : minScale;
					float scaleRatio = realScale.x / initialScale.x;
					network.transform.position = initialPosition - (scaleRatio - 1) * (startPos - initialPosition);	 
					network.transform.localScale = realScale;
			} 
	}

}

