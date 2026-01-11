import {
	ATTACK_MARKER_IDS,
	BIND_MARKER_IDS,
	GENERIC_MARKER_IDS,
	IGNORE_MARKER_IDS,
} from "../../constants";
import { renderOriginalIconIfEnabled } from "../../utils";
import { PlaceholderObject } from "../PlaceholderObject";
import { AttackMarkerIcon } from "./AttackMarker";
import { BindMarkerIcon } from "./BindMarker";
import { GenericMarkerIcon } from "./GenericMarker";
import { IgnoreMarkerIcon } from "./IgnoreMarker";

export function MarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

	if (ATTACK_MARKER_IDS.includes(objectId)) {
		return <AttackMarkerIcon objectId={objectId} transform={transform} />;
	}
	if (BIND_MARKER_IDS.includes(objectId)) {
		return <BindMarkerIcon objectId={objectId} transform={transform} />;
	}
	if (IGNORE_MARKER_IDS.includes(objectId)) {
		return <IgnoreMarkerIcon objectId={objectId} transform={transform} />;
	}
	if (GENERIC_MARKER_IDS.includes(objectId)) {
		return <GenericMarkerIcon objectId={objectId} transform={transform} />;
	}
	return <PlaceholderObject objectId={objectId} transform={transform} />;
}
