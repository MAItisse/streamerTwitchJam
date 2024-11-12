
export type Boundary = {
    left: number;
    right: number;
    bottom: number;
    top: number;
};

export type BoundaryWithKey = Boundary & { key: string };
