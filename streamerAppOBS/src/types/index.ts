
export type Boundary = {
    left: number;
    right: number;
    bottom: number;
    top: number;
};

// export type BoundaryWithKey = Boundary & { key: string };

export type Boundaries = {
    [key: string]: Boundary;
};
export type SourceToBoundaryMap = {
    [key: string]: string;// | null;
};

export type SourceInfoCard = {
    title: string | null;
    description: string | null;
};
export type SourceInfoCards = {
    [key: string]: SourceInfoCard;
};

export type OBSVideoSettings = {
    fpsNumerator: number;
    fpsDenominator: number;
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
}

// export type SceneItems = SceneItem[];

// export type SceneItem = {
//     sceneItemId: number,
//     sourceName: string,

// }


export type SetSceneItemTransformRequest = {
    sceneName: string;
    sceneItemId: number;
    sceneItemTransform: SceneItemTransform;
}

export type SceneItemTransform = {
    positionX: number;
    positionY: number;
}