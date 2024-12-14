import { ObjectId } from 'mongodb';

const basicUtils = {
    isValidId(id) {
        try {
            ObjectId(id);
        } catch (error) {
            return false;
        },
        return true;
    },
};

export default basicUtils;
