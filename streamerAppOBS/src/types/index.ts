
export type Boundary = {
    left: number;
    right: number;
    bottom: number;
    top: number;
};

export type Boundaries = {
    [key: string]: Boundary;
};
export type SourceToBoundaryMap = {
    [key: string]: string;
};

export type SourceInfoCard = {
    title: string | null;
    description: string | null;
};
export type SourceInfoCards = {
    [key: string]: SourceInfoCard;
};

export type AllowList = {
    allowed: string;
}

export type AllowListToSource = {
    [key: string]: AllowList;
}

export type OBSVideoSettings = {
    fpsNumerator: number;
    fpsDenominator: number;
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
}

export type SetSceneItemTransformRequest = {
    sceneName: string;
    sceneItemId: number;
    sceneItemTransform: SceneItemTransform;
}

export type SceneItemTransform = {
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    cropLeft: number;
    cropRight: number;
    cropTop: number;
    cropBottom: number;
}